# Code Review Checklist

## Correctness
- [ ] Logic handles edge cases (null, empty, boundary values)
- [ ] Error paths are covered (try/catch, error returns)
- [ ] No off-by-one errors in loops or slicing

## Style
- [ ] Naming is clear and consistent with codebase conventions
- [ ] No dead code or commented-out blocks
- [ ] Functions are focused (single responsibility)

## Security
- [ ] No secrets or credentials in code
- [ ] User input is validated before use
- [ ] SQL/command injection is prevented

## Testing
- [ ] New code has corresponding tests
- [ ] Tests cover happy path and error cases
- [ ] No flaky patterns (timing, ordering, shared state)
