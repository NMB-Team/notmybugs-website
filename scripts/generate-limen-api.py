import argparse
import json
from pathlib import Path
import re
import subprocess
from tempfile import TemporaryDirectory
from textwrap import dedent
import xml.etree.ElementTree as ET


TYPE_TAGS = {"c", "e", "t", "x", "f", "a", "d"}
TYPE_KINDS = {"class", "abstract", "enum", "typedef"}
PACKAGE_ROOT = "limen."


def has_meta(node, name):
	return node.find(f"./meta/m[@n=':{name}']") is not None


def children_of_type(node):
	return [child for child in node if child.tag in TYPE_TAGS]


def parameters(node):
	params = node.get("params", "").split(":")
	return "<" + ", ".join(params) + ">" if any(params) else ""


def arguments(node, types, drop_receiver=False):
	names = node.get("a", "").split(":")
	defaults = node.get("v", "").split(":")
	result = []

	for index, (name, arg) in enumerate(zip(names, types, strict=True)):
		if drop_receiver and index == 0:
			continue

		default = defaults[index] if index < len(defaults) else ""
		signature = f"{name.lstrip('?') if default else name}: {type_name(arg)}" if name else type_name(arg)
		result.append(signature + (f" = {default}" if default else ""))

	return ", ".join(result)


def type_name(node):
	if node.tag == "d":
		return "Dynamic"
	if node.tag == "f":
		types = list(node)
		args = arguments(node, types[:-1]) if len(types) > 1 else ""
		return f"({args}) -> {type_name(types[-1])}"
	if node.tag == "a":
		return "{ " + ", ".join(field_signature(field) for field in node) + " }"

	name = node.attrib["path"]
	if name.startswith("S") and name[1:].startswith(("dx_", "vk_", "gl_", "sdl_", "fsr_", "dlss_")):
		return json.dumps(name[1:])

	args = ", ".join(type_name(arg) for arg in node)
	return f"{name}<{args}>" if args else name


def field_signature(field):
	field_type = children_of_type(field)[0]
	prefix = "?" if has_meta(field, "optional") else ""
	get, set_ = field.get("get"), field.get("set")

	if (get, set_) in {(None, None), ("inline", "null")} or has_meta(field, "optional"):
		access = ""
	else:
		read = 'get' if get == 'accessor' else get or 'default'
		write = 'set' if set_ == 'accessor' else set_ or 'default'
		access = f"({read}, {write})"

	return f"{prefix}{field.tag}{access}: {type_name(field_type)}"


def documentation(node):
	value = node.findtext("haxe_doc", "")
	first, _, rest = value.partition("\n")
	return (first.strip() + "\n" + dedent(rest)).strip()


def index_types(root):
	return {
		node.attrib["path"]: node for node in root
		if node.tag in TYPE_KINDS
		and node.get("path", "").startswith(PACKAGE_ROOT)
		and not node.get("private")
	}


def member_nodes(node):
	if node.tag == "enum":
		return [f for f in node if f.tag not in {"meta", "haxe_doc"}]
	if node.tag == "typedef":
		return list(node.find("a")) if node.find("a") is not None else []

	owner = node.find("./impl/class") if node.tag == "abstract" else node
	return [
		field for field in (() if owner is None else owner)
		if field.get("public") or has_meta(field, "op") or has_meta(field, "arrayAccess")
	]


def describe_member(node, field, base_members):
	name = field.tag
	doc = documentation(field)
	line = int(field.get("line", "0"))
	kind = "field"

	if node.tag == "enum":
		kind = "value"
		signature = name
		if len(children_of_type(field)):
			signature += f"({arguments(field, children_of_type(field))})"
	elif node.tag == "typedef":
		signature = field_signature(field)
	else:
		field_type = children_of_type(field)[0]
		receiver = node.tag == "abstract" and field_type.get("a", "").split(":")[0] == "this"
		static = bool(field.get("static")) and not receiver
		is_method = field_type.tag == "f" and (
			field.get("set") in {"method", "dynamic"} or field.get("get") == "inline"
		)

		if is_method:
			if name in {"new", "_new"}:
				kind, name, static = "constructor", "new", False
			elif has_meta(field, "op") or has_meta(field, "arrayAccess"):
				kind = "operator"
			else:
				kind = "staticMethod" if static else "method"

			types = list(field_type)
			args = arguments(field_type, types[:-1], receiver) if len(types) > 1 else ""
			returns = "Void" if kind == "constructor" else type_name(types[-1])
			signature = f"{'static ' if static else ''}function {name}{parameters(field)}({args}): {returns}"

			operator = field.findtext("./meta/m[@n=':op']/e")
			if operator or kind == "operator":
				signature = f"{operator or 'value[index]'}  ·  {signature}"
		else:
			const = has_meta(field, "enum") or field.get("get") == "inline"
			kind = "value" if const else "staticField" if static else "field"
			keyword = "var " if not const else ""
			if field.get("final"):
				keyword = "final "

			signature = ("static " if static and not const else "") + keyword + field_signature(field)
			if field.get("expr"):
				signature += " = " + field.attrib["expr"].removeprefix("cast ") if const else " = " + field.attrib["expr"]

	member = dict(name=name, kind=kind, signature=signature)
	if doc:
		member["doc"] = doc
	if line:
		member["line"] = line
	if has_meta(field, "noCompletion"):
		member["internal"] = True
	if field.tag not in base_members:
		member["define"] = "heaps_debug_events" if name.startswith("pix") else "hlxbo"

	return member


def describe_type(path, node, base, source):
	module = node.get("module", path)
	name = path.rsplit(".", 1)[-1]
	import_path = path if module == path else f"{module}.{name}"
	file = module.replace(".", "/") + ".hx"
	kind = node.tag
	declaration = f"{kind} {name}{parameters(node)}"

	if kind == "abstract":
		if has_meta(node, "enum"):
			declaration = "enum " + declaration
			kind = "enumAbstract"
		backing = type_name(node.find("this")[0])
		declaration += f"({backing})"

		for direction in ("from", "to"):
			for cast in node.findall(f"./{direction}/icast"):
				declaration += f" {direction} {type_name(cast[0])}"

	if kind == "class":
		for relation in (*node.findall("extends"), *node.findall("implements")):
			declaration += f" {relation.tag} {type_name(relation)}"

	if kind == "typedef":
		target = children_of_type(node)[0]
		if target.tag != "a":
			declaration += f" = {type_name(target)}"

	lines = (source / file).read_text(encoding="utf-8-sig").splitlines()
	pattern = re.compile(rf"\b(?:class|enum|abstract|typedef)\s+{re.escape(name)}\b")
	line = next((i for i, text in enumerate(lines, 1) if pattern.search(text)), 1)
	base_members = {field.tag for field in member_nodes(base[path])}
	members = [describe_member(node, field, base_members) for field in member_nodes(node)]
	output = dict(path=path, importPath=import_path, kind=kind, declaration=declaration,
				  file=file, line=line, members=members)

	if doc := documentation(node):
		output["doc"] = doc
	if ".internal." in path or has_meta(node, "noCompletion"):
		output["internal"] = True
	if forwarded := node.findall("./meta/m[@n=':forward']/e"):
		output["forwarded"] = [field.text for field in forwarded]

	return output


def compile_api(source, output, defines=()):
	command = ["haxe", "-cp", str(source), "-lib", "format", "--macro",
			   "include('limen', true, null, null, true)", "--dce", "no",
			   "--hl", str(output.with_suffix(".hl")), "--xml", str(output)]

	for define in defines:
		command.extend(("-D", define))

	subprocess.run(command, check=True)
	return index_types(ET.parse(output).getroot())


def main():
	parser = argparse.ArgumentParser(description="Generate the Limen Haxe API catalog.")
	parser.add_argument("source", type=Path, help="Limen checkout (requires Haxe and the format haxelib)")
	args = parser.parse_args()
	source = args.source.resolve()

	if subprocess.check_output(["git", "-C", str(source), "status", "--porcelain", "--", "limen", "haxelib.json"]).strip():
		parser.error("Limen API sources must match the checked-out revision")

	revision = subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"], text=True).strip()
	version = json.loads((source / "haxelib.json").read_text(encoding="utf-8-sig"))["version"]

	with TemporaryDirectory() as temp:
		base = compile_api(source, Path(temp) / "base.xml")
		types = compile_api(source, Path(temp) / "all.xml", ("heaps_debug_events", "hlxbo"))

	catalog = [describe_type(path, node, base, source) for path, node in sorted(types.items())]
	header = json.dumps(dict(revision=revision, version=version), ensure_ascii=False)
	entries = ",\n".join("    " + json.dumps(entry, ensure_ascii=False) for entry in catalog)
	destination = Path(__file__).resolve().parents[1] / "src/content/developer/api/catalog.json"
	destination.write_text(header[:-1] + ',\n  "types": [\n' + entries + "\n  ]\n}\n", encoding="utf-8", newline="\n")
	(destination.parent / "LICENSE").write_bytes((source / "LICENSE").read_bytes())
	print(f"Limen {version} ({revision[:7]}): {len(catalog)} types, {sum(len(t['members']) for t in catalog)} members")


if __name__ == "__main__":
	main()
