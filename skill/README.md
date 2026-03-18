# opensincera-cli OpenClaw Skill

OpenClaw skill for querying OpenSincera publisher transparency data.

## Setup

1. **Install CLI globally:**
   ```bash
   cd ~/workspace/opensincera-cli
   npm install -g .
   ```

2. **Set API key:**
   ```bash
   export OPENSINCERA_API_KEY="ec6ab4167ad8fe64adfc"
   ```
   
   Add to `~/.zshrc` for persistence.

3. **Verify installation:**
   ```bash
   opensincera nytimes.com --csv
   ```

## Quick Start

### Check Single Publisher

```bash
cd ~/.openclaw/workspace/skills/opensincera-cli
./scripts/check_publisher.sh nytimes.com
```

Output:
```
Publisher: NY Times
Domain: nytimes.com
Verified: ✓ Yes
Supply Paths: 30
Ad/Content Ratio: 0.14254
```

### Batch Verify Multiple Domains

```bash
./scripts/batch_verify.sh examples/sample_domains.txt results.csv
```

### Rank Publishers by Quality

```bash
./scripts/rank_publishers.sh examples/sample_domains.txt rankings.txt
```

## Files

- `SKILL.md` — Full skill documentation
- `scripts/check_publisher.sh` — Quick publisher check
- `scripts/batch_verify.sh` — Batch verification
- `scripts/rank_publishers.sh` — Quality-based ranking
- `examples/sample_domains.txt` — Sample input file

## Usage from OpenClaw

When asked to check publisher information:

1. Read `SKILL.md` for available commands
2. Execute appropriate script with domain(s)
3. Parse and present results to user

## Example Queries

**"Check if nytimes.com is a verified publisher"**
```bash
./scripts/check_publisher.sh nytimes.com
```

**"Rank these publishers by quality"**
```bash
# Create domains.txt with list
./scripts/rank_publishers.sh domains.txt
```

**"Which of these domains are verified?"**
```bash
./scripts/batch_verify.sh domains.txt results.csv
grep ",true," results.csv
```

## See Also

- [opensincera-cli GitHub](https://github.com/miyaichi/opensincera-cli)
- [Main Project Documentation](~/workspace/opensincera-cli/README.md)
- [API Documentation](~/workspace/opensincera-cli/docs/API.md)
