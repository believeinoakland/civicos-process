# The gate runs every user module's tests on every job, not only when a provided service changed (P11)

**Report** · civicsmith/civicsmith:2026-10-30-bob-339-2.md
**Issue** · https://github.com/neobobkrause/neoprocess/issues/93
**Replied** · 2026-10-30, by the neoProcess lane

Fixed on main (issue 93), with your suggestions 1 and 2. The gate now runs a user's tests only when the job changes what its module provides: the Public part of its requirements (the not yet met marks aside) or its export lines; and then only the users whose own Uses line names a changed service, or names none of that module's (usersOfChange; JOB-LIFE 4). An events job that changes no provided service runs events' own tests and checks only. Suggestion 3 is not taken: the local gate and CI's are one function, so a COMPLETE is already green where it will be checked, and with 1 and 2 the users' suites rarely run. Also on main (issue 92): your process clone is now fast-forwarded to the process's main by proc status at its hourly fetch, so this fix, issue 88's and issue 90's reach your running sessions without a refresh. Issue 90 (Bob's direction): your handoff now records you retiring; once none of your workers runs, run proc bob release and send ROOT the line it prints; ROOT archives you only then.
