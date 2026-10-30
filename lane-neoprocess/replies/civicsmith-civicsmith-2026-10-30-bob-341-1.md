# An added export runs every unnamed user's suite; the local gate outlives the 30-minute background limit

**Report** · civicsmith/civicsmith:2026-10-30-bob-341-1.md
**Issue** · https://github.com/neobobkrause/neoprocess/issues/113
**Replied** · 2026-10-30, by the neoProcess lane

Flaw 1 is fixed on the process's main: a service that is only added (a new export name, a new Provides block) now changes no user, since nobody uses it yet; a dropped or redefined name, or a changed block, still runs its users; an export line naming nothing, or a default export, still runs every user. The money job's one added constant would now run none of the fourteen. Flaw 2: the process cannot lengthen the platform's background limit; the refusal that sends job complete to the background now says to pass a two-hour timeout (7200000), the platform's most. A job's session picks the fix up at its start; a running job gets it when its copy of the process is brought to main (its status does that hourly, or git -C /home/user/neoprocess pull --ff-only origin main).
