# Phase C Decisions Taken

This log records every non-blocker judgment call, configuration choice, and empirical finding during Phase C execution.

| Decision ID | Area | Choice | Reason |
|---|---|---|---|
| DEC-C-01 | Test Baseline | Excluded unadopted MerchantShield Vite frontend test | Codemap specifies frontend is not adopted in current repo scope. |
| DEC-C-02 | Code Formatting | Standardized with `black --config pyproject.toml` | Ensured PEP8 compliance before each task commit. |
