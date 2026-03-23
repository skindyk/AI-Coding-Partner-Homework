# How to Run the AI-Powered Multi-Agent Banking Pipeline

Follow these numbered steps to set up and run the project from scratch.

## Steps

1. **Navigate to the homework-6 directory**

   ```bash
   cd homework-6
   ```

2. **Create and activate a virtual environment**

   ```bash
   python -m venv .venv
   ```

   Activate it:

   - macOS / Linux:
     ```bash
     source .venv/bin/activate
     ```
   - Windows (Command Prompt):
     ```cmd
     .venv\Scripts\activate
     ```
   - Windows (PowerShell):
     ```powershell
     .venv\Scripts\Activate.ps1
     ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the pipeline**

   Processes all 8 transactions from `sample-transactions.json` through the full
   3-agent pipeline and writes results to `shared/results/`.

   ```bash
   python integrator.py
   ```

5. **View results**

   List the output files produced by the pipeline:

   - macOS / Linux:
     ```bash
     ls shared/results/
     ```
   - Windows:
     ```cmd
     dir shared\results\
     ```

   Each `.json` file corresponds to one transaction and contains the full audit
   trail including fraud risk score and compliance status.

6. **Run the test suite**

   ```bash
   python -m pytest tests/ --cov=agents --cov-report=term-missing -v
   ```

   All 36 tests should pass with >= 80% coverage across the agents package.

7. **Start the MCP server**

   The MCP server exposes pipeline tools to Claude Code skills.

   ```bash
   python mcp/server.py
   ```

8. **Use Claude Code skills**

   Once the MCP server is running, the following Claude Code skills are available
   inside this project:

   - `/run-pipeline` — Runs the full 3-agent pipeline against `sample-transactions.json`
     and returns a summary table of results.

   - `/validate-transactions` — Dry-runs the Transaction Validator against
     `sample-transactions.json` and prints a validation table without writing any files.
