"""Policy engine mapping severity bands to soft actions.

TODO: Implement severity -> soft action table:
- none (< 0.30): allow
- info (0.30 - 0.50): allow + log
- warning (0.50 - 0.67): step_up_verify or prefer_prepaid
- critical (>= 0.67): manual_review (holds capture, does not reject buyer)

Enforce SHADOW_MODE defaults where soft actions never alter payment outcomes.
"""
