# Grants: everything the work needs, gathered before it starts and held to the end

**Status** · BOB's mechanism for Bob's ruling of 29 Oct 2026 (PERMISSIONS §10, his words there). The process names no product here: what a product needs is in its own `build/grants.json` and its grant list, written at its setup (PRODUCT-SUPPLIES).

## 1. What can stop an act, and the grant that clears it

| what stops it | the grant | given by | held while |
| --- | --- | --- | --- |
| the process's hooks | none: the hook names the route; the act table (`tools/acts.md`) holds the route | — | always |
| a permission prompt | the standing list (`permissions.json`) in the repository's `.claude/settings.json`, written by `proc shims` | Bob's approval of PERMISSIONS §6, written once per repository (a session may not widen its own settings: the classifier refuses it as Self-Modification, measured 29 Oct #7, so the write is taken at a repository's seeding, or by a session Bob tells in words to write it) | the gate fails on drift |
| the auto-mode classifier | sessions started in Auto (Bob picks the mode when he starts a session; a child never exceeds its parent), routes the classifier accepts (PERMISSIONS §2.2, §2.3), and the standing list's allow rules, which Auto resolves at once | Bob's mode at the sessions he starts (ROOT, the neoProcess lane) | every session |
| the repository host's scope | the Claude GitHub app on the account with access to **all** repositories, so a new repository is covered without a new act; the process's own administration token (PERMISSIONS §9) for creating repositories and their rulesets | Bob, once each | the token's expiry, renewed ahead (§3) |
| a credential for a service | each credential the product's list names, as a network secret (or a variable) on the environment its sessions use; read only inside the tool's commands, never in a hand command | Bob, once each, at the sitting | expiry renewed ahead |
| the network policy | the environment's allowed hosts cover every host in the product's list | Bob, once per environment | — |
| a workflow's secret or reviewer | each repository secret and environment the product's workflows name, set at setup; a required reviewer only where Bob's policy keeps one | Bob, or the process's token where its scope allows | — |
| a resource of another account | none crosses accounts: pages, documents and sessions live on the account the process runs on (PERMISSIONS §10.6) | — | always |
| an act only a person can take while a release is exercised (a code typed from an inbox, a sign-in) | named in the product's list with its alternative (an API key, a test identity), given at the sitting | Bob | — |

Archiving finished sessions is not a grant: an idle session costs nothing (PROTOCOL §7), and Bob archives only if he wants to.

## 2. What a product supplies (PRODUCT-SUPPLIES)

Its grant list, by stage (develop; test; deploy a development release; exercise a release): each act, the service and host, the credential or access by name (never a value), and where the product uses it. Its `build/grants.json`, which `proc grants check` reads:

```json
{ "services": [{ "name": "<shown in the check>", "url": "<an endpoint that answers through the proxy with the credential>", "active": "<json.path>=<value>", "expires": "<json.path to an expiry date>" }],
  "urls": ["<each address a development release is exercised at>"],
  "variables": ["<each variable a stage reads, by name: the check reports it present or not, never its value>"] }
```

## 3. Held, checked and renewed

`proc grants check` proves, from the session: the standing list present, the push to the role's own branch, the repository host's API answering as the expected identity (the kind of token and its expiry), each service of the product's list active and not expiring within 14 days, each address answering, each variable it names present. It records the result in `.git/proc-grants.json`; `proc tranche open` refuses unless it passed within the last day. A row that fails names the grant and, by this table, who gives it.

## 4. The sitting

Before a product's first tranche, BOB writes one walkthrough from the product's list and this table: every grant only Bob can give, in one order, each step written from the page he will use (P20), each with how the check will show it held. Bob takes it once. Nothing else is asked of him while the work runs; a request or refusal the list did not predict is a flaw in the list (PERMISSIONS §10.5).
