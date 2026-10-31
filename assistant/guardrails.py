"""Deterministic guardrails for LLM responses.

TODO: Inspect LLM output text against stored database records.
Strictly reject or trigger regeneration if the LLM hallucinated any order ID,
tracking number, delivery date, customer ID, or monetary amount not present
in the verified source record.
"""
