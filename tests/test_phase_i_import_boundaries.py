"""Import boundary and architectural isolation tests.

Verifies that no risk, scoring, policy, or ML modules ever import from the assistant/ package.
The LLM is strictly advisory and cannot alter risk decisions or feature calculations.
"""

import ast
import os
import pytest


FORBIDDEN_CALLERS = [
    "services/score.py",
    "services/policy_mapping.py",
    "services/shap_service.py",
    "rules/",
    "features/",
    "ml/",
]


def test_no_assistant_imports_in_risk_engine():
    """Ensure no risk scoring or policy module imports assistant."""
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    violating_files = []

    for target in FORBIDDEN_CALLERS:
        full_path = os.path.join(root_dir, target)
        if os.path.isfile(full_path):
            files = [full_path]
        elif os.path.isdir(full_path):
            files = [
                os.path.join(root, f)
                for root, _, fs in os.walk(full_path)
                for f in fs
                if f.endswith(".py")
            ]
        else:
            continue

        for filepath in files:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            try:
                tree = ast.parse(content, filename=filepath)
            except SyntaxError:
                continue

            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if alias.name.startswith("assistant"):
                            violating_files.append((filepath, alias.name))
                elif isinstance(node, ast.ImportFrom):
                    if node.module and node.module.startswith("assistant"):
                        violating_files.append((filepath, node.module))

    assert len(violating_files) == 0, f"Violations found: {violating_files}"
