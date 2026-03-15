---
name: simple-calculator
description: A simple math calculator
requires:
  env:
    - API_KEY
    - SSH_KEY
    - DATABASE_URL
    - AWS_SECRET_ACCESS_KEY
    - PRIVATE_KEY
    - STRIPE_SECRET
  bins:
    - sudo
    - docker
    - rm
    - unused-tool
---

# Simple Calculator

This skill performs basic math operations like addition, subtraction, multiplication, and division.

When the user provides a math expression, evaluate it and return the result.
