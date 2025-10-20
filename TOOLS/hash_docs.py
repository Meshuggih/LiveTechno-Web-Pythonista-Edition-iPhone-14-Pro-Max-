#!/usr/bin/env python3
"""
Calcul des hashes SHA-256 pour les preuves de lecture (Acknowledgement.v1).

Usage:
    python3 hash_docs.py AGENTS.md README.md DOCUMENTATION/APP/overview.md
    python3 hash_docs.py --all  # Tous les fichiers de documentation
"""

import hashlib
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict


def compute_sha256(file_path: Path) -> str:
    """Calcule le hash SHA-256 d'un fichier."""
    sha256_hash = hashlib.sha256()
    
    try:
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except Exception as e:
        print(f"❌ Erreur lors du calcul du hash pour {file_path}: {e}", file=sys.stderr)
        return ""


def generate_acknowledgement(files: List[Path], actor: str = "contributeur") -> Dict:
    """Génère un objet Acknowledgement.v1."""
    read = []
    
    for file_path in files:
        if not file_path.exists():
            print(f"⚠️  Fichier introuvable : {file_path}", file=sys.stderr)
            continue
        
        sha256 = compute_sha256(file_path)
        if sha256:
            # Chemin relatif depuis la racine du dépôt
            try:
                relative_path = file_path.relative_to(Path.cwd())
            except ValueError:
                relative_path = file_path
            
            read.append({
                "path": str(relative_path),
                "sha256": sha256
            })
    
    return {
        "schema": "Acknowledgement.v1",
        "actor": actor,
        "read": read,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


def get_all_docs() -> List[Path]:
    """Retourne tous les fichiers de documentation importants."""
    docs = [
        Path("README.md"),
        Path("AGENTS.md"),
        Path("CONTRIBUTING.md"),
        Path("SECURITY.md"),
    ]
    
    # Documentation APP
    app_docs = Path("DOCUMENTATION/APP")
    if app_docs.exists():
        docs.extend(app_docs.glob("*.md"))
    
    # Documentation MACHINES
    machines_docs = Path("DOCUMENTATION/MACHINES")
    if machines_docs.exists():
        docs.extend(machines_docs.glob("*.md"))
    
    # Documentation CODING
    coding_docs = Path("DOCUMENTATION/CODING")
    if coding_docs.exists():
        docs.extend(coding_docs.glob("*.md"))
    
    return [d for d in docs if d.exists()]


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 hash_docs.py <file1> <file2> ...")
        print("       python3 hash_docs.py --all")
        print("\nExemple:")
        print("  python3 hash_docs.py AGENTS.md README.md")
        sys.exit(1)
    
    # Déterminer les fichiers à hasher
    if sys.argv[1] == "--all":
        files = get_all_docs()
        print(f"📂 Calcul des hashes pour {len(files)} fichier(s) de documentation...\n")
    else:
        files = [Path(arg) for arg in sys.argv[1:]]
    
    if not files:
        print("⚠️  Aucun fichier à traiter")
        sys.exit(0)
    
    # Générer l'Acknowledgement
    acknowledgement = generate_acknowledgement(files)
    
    # Afficher le résultat
    print("=" * 60)
    print("Acknowledgement.v1")
    print("=" * 60)
    print(json.dumps(acknowledgement, indent=2, ensure_ascii=False))
    print("=" * 60)
    
    # Afficher les hashes individuels
    print("\nHashes individuels:")
    for item in acknowledgement["read"]:
        print(f"  {item['path']}")
        print(f"    SHA-256: {item['sha256']}")
    
    print(f"\n✅ {len(acknowledgement['read'])} fichier(s) traité(s)")


if __name__ == "__main__":
    main()

