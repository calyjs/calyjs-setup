# Pull Request Template

Thank you for your contribution! Please review the checklist and fill in the required sections to ensure a smooth review process.

---

## Description

Clearly describe the purpose of this pull request. What issue does it address or what enhancement does it introduce?

> _Example: Implements user authentication using JWT to secure private routes._

---

## Type of Change

Indicate the nature of your change by selecting the appropriate category:

- [ ] ✨ Feature (`feature/*`) — New functionality
- [ ] 🐛 Fix (`fix/*`) — Bug fix or hotfix
- [ ] 🛠 Refactor (`refactor/*`) — Code improvement without behavior change
- [ ] 🎨 Style (`style/*`) — Code style updates (formatting, spacing, etc.)
- [ ] 📚 Documentation (`docs/*`) — Documentation-only changes
- [ ] 🔁 Revert (`revert/*`) — Reverts a previous commit
- [ ] ⚙️ CI/CD (`ci/*`) — Configuration for build or deployment pipelines
- [ ] 🧹 Chore (`chore/*`) — Maintenance tasks

---

## Checklist

Please ensure the following items are completed before requesting a review:

- [ ] My branch name follows the format: `<type>/<short-description>`
- [ ] The pull request targets the `develop` branch
- [ ] My changes follow the [project coding style](../CONTRIBUTING.md) and guidelines of the project
- [ ] I have written clear and descriptive commit messages using the [Conventional Commits](https://www.conventionalcommits.org) standard
- [ ] All new and existing tests pass locally
- [ ] I have added or updated relevant documentation as needed
- [ ] I understand that once merged to `develop`, a follow-up PR must target `master`

---

## Testing

Provide a brief summary of tests performed to verify the changes.

> _Example: Verified token validation logic with valid and expired tokens using Postman. All tests passed._

---

## Additional Notes (Optional)

Add any extra context, considerations, or related discussions here.

> _Example: This PR introduces changes to the login API and may impact the mobile app._

---

## Related Issues or Tickets

Link any related issues or tickets:

> _Closes #123_  
> _Related to ticket: TCK-456_

---

Thank you for your time and contribution!
