#!/usr/bin/env python3
"""
Validation des fichiers JSON contre les schémas JSON Schema (Draft-07+).

Usage:
    python3 validate.py SCHEMAS/
    python3 validate.py MACHINES/
    python3 validate.py path/to/file.json
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple

try:
    import jsonschema
    from jsonschema import Draft7Validator
except ImportError:
    print("❌ Erreur : jsonschema n'est pas installé")
    print("Installation : pip3 install jsonschema")
    sys.exit(1)


def load_json(path: Path) -> Dict:
    """Charge un fichier JSON."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON invalide : {e}")


def load_schemas(schemas_dir: Path) -> Dict[str, Dict]:
    """Charge tous les schémas JSON depuis le répertoire SCHEMAS/."""
    schemas = {}
    for schema_file in schemas_dir.rglob("*.schema.json"):
        schema = load_json(schema_file)
        schema_id = schema.get("$id", schema_file.name)
        schemas[schema_id] = schema
    return schemas


def validate_file(file_path: Path, schemas: Dict[str, Dict]) -> Tuple[bool, List[str]]:
    """Valide un fichier JSON contre son schéma."""
    errors = []
    
    try:
        data = load_json(file_path)
    except Exception as e:
        return False, [f"Erreur de chargement : {e}"]
    
    # Déterminer le schéma à utiliser
    schema_name = data.get("schema")
    if not schema_name:
        return False, ["Champ 'schema' manquant"]
    
    schema_id = f"{schema_name}.schema.json"
    schema = schemas.get(schema_id)
    
    if not schema:
        return False, [f"Schéma '{schema_id}' introuvable"]
    
    # Valider
    try:
        validator = Draft7Validator(schema)
        validation_errors = list(validator.iter_errors(data))
        
        if validation_errors:
            for error in validation_errors:
                path = " → ".join(str(p) for p in error.path)
                errors.append(f"{path}: {error.message}")
            return False, errors
        
        return True, []
    
    except Exception as e:
        return False, [f"Erreur de validation : {e}"]


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate.py <path>")
        print("  <path> peut être un fichier JSON ou un répertoire")
        sys.exit(1)
    
    target = Path(sys.argv[1])
    
    # Charger les schémas
    schemas_dir = Path(__file__).parent.parent / "SCHEMAS"
    if not schemas_dir.exists():
        print(f"❌ Répertoire SCHEMAS/ introuvable : {schemas_dir}")
        sys.exit(1)
    
    print(f"📂 Chargement des schémas depuis {schemas_dir}...")
    schemas = load_schemas(schemas_dir)
    print(f"✅ {len(schemas)} schémas chargés\n")
    
    # Collecter les fichiers à valider
    files_to_validate = []
    if target.is_file():
        if target.suffix == ".json" and not target.name.endswith(".schema.json"):
            files_to_validate.append(target)
    elif target.is_dir():
        for json_file in target.rglob("*.json"):
            if not json_file.name.endswith(".schema.json"):
                files_to_validate.append(json_file)
    else:
        print(f"❌ Chemin invalide : {target}")
        sys.exit(1)
    
    if not files_to_validate:
        print("⚠️  Aucun fichier JSON à valider")
        sys.exit(0)
    
    print(f"🔍 Validation de {len(files_to_validate)} fichier(s)...\n")
    
    # Valider chaque fichier
    success_count = 0
    error_count = 0
    
    for file_path in files_to_validate:
        relative_path = file_path.relative_to(Path.cwd())
        valid, errors = validate_file(file_path, schemas)
        
        if valid:
            print(f"✅ {relative_path}")
            success_count += 1
        else:
            print(f"❌ {relative_path}")
            for error in errors:
                print(f"   • {error}")
            error_count += 1
    
    # Résumé
    print(f"\n{'='*60}")
    print(f"✅ Valides : {success_count}")
    print(f"❌ Erreurs : {error_count}")
    print(f"{'='*60}")
    
    sys.exit(0 if error_count == 0 else 1)


if __name__ == "__main__":
    main()

