# Installation Guide

## Prerequisites

- Node.js >= 18.0.0
- npm (comes with Node.js)
- OpenClaw (for skill integration)

## Step 1: Clone Repository

```bash
cd ~/workspace
git clone https://github.com/miyaichi/opensincera-cli.git
cd opensincera-cli
```

## Step 2: Install CLI Globally

```bash
npm install -g .
```

This will make the `opensincera` command available system-wide.

**Verify installation:**
```bash
which opensincera
# Expected: /opt/homebrew/bin/opensincera (or similar)

opensincera --help
```

## Step 3: Set API Key

Add to your shell configuration file (`~/.zshrc` or `~/.bashrc`):

```bash
export OPENSINCERA_API_KEY="your-api-key-here"
```

Then reload:
```bash
source ~/.zshrc
```

**Verify API key:**
```bash
echo $OPENSINCERA_API_KEY
```

## Step 4: Test Basic Functionality

```bash
opensincera nytimes.com
```

Expected output:
```json
{
  "publisher_id": 75,
  "name": "NY Times",
  "domain": "nytimes.com",
  ...
}
```

## Step 5: Install OpenClaw Skill (Optional)

If you use OpenClaw, install the skill:

```bash
npm run install-skill
```

This copies the skill to `~/.openclaw/workspace/skills/opensincera-cli/`

**Verify skill installation:**
```bash
ls ~/.openclaw/workspace/skills/opensincera-cli/
# Expected: SKILL.md  README.md  scripts/  examples/
```

## Step 6: Test Skill Scripts

```bash
cd ~/.openclaw/workspace/skills/opensincera-cli
./scripts/check_publisher.sh nytimes.com
```

Expected output:
```
Publisher: NY Times
Domain: nytimes.com
Verified: ✓ Yes
Supply Paths: 30
Ad/Content Ratio: 0.14254
```

## Troubleshooting

### Command not found: opensincera

**Problem:** npm global bin directory is not in PATH

**Solution:**
```bash
# Check npm global bin path
npm config get prefix

# Add to PATH in ~/.zshrc
export PATH="$(npm config get prefix)/bin:$PATH"
source ~/.zshrc
```

### Error: OPENSINCERA_API_KEY environment variable is required

**Problem:** API key not set

**Solution:**
```bash
export OPENSINCERA_API_KEY="your-api-key-here"

# Make it permanent
echo 'export OPENSINCERA_API_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

### Error: Domain not found

**Problem:** Domain not in OpenSincera database

**Solution:** This is expected for some domains. Try a known publisher:
```bash
opensincera google.com
```

### Permission denied: ./scripts/*.sh

**Problem:** Scripts not executable

**Solution:**
```bash
cd ~/.openclaw/workspace/skills/opensincera-cli
chmod +x scripts/*.sh
```

## Uninstallation

### Remove CLI

```bash
npm uninstall -g opensincera-cli
```

### Remove Skill

```bash
rm -rf ~/.openclaw/workspace/skills/opensincera-cli
```

### Remove API Key

Edit `~/.zshrc` and remove the `OPENSINCERA_API_KEY` line.

## Updating

```bash
cd ~/workspace/opensincera-cli
git pull
npm install -g .
npm run install-skill  # Update skill if installed
```

## Next Steps

- Read [README.md](README.md) for usage examples
- Read [skill/SKILL.md](skill/SKILL.md) for OpenClaw integration
- Check [docs/API.md](docs/API.md) for API reference
