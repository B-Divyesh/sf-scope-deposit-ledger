# Demo sandbox

Open `https://scope-deposit-ledger.sociobot.in/demo` or select **Try it with
sample data** on the home page.

The demo starts with a CAD 4,250.75 deposit for the Cedar Lane kitchen refit.
It includes three scope items, held-to-earned history, a returned allowance,
tax wording, and an unallocated balance.

Demo records use the IndexedDB database `demo:scope-deposit-ledger`. Normal
records use `scope-deposit-ledger`. Demo license and theme settings also use
keys prefixed with `demo:`. The demo does not read or write the normal database
or normal settings.

**Reset demo** replaces only demo records with the original sample. **Start for
real** clears the demo database and demo settings, then opens the normal ledger.
The direct `/?demo=1` entry uses the same isolated mode.
