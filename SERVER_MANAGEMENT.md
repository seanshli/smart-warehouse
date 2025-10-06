# Server Management Guide

## 🚀 Starting the Server

### Normal Start
```bash
npm run dev
```
Server will run on http://localhost:3000

### Clean Start (Recommended)
```bash
# Clean everything and start fresh
./scripts/clean-start.sh
```

## 🛑 Stopping the Server

### Method 1: Graceful Stop (Recommended)
```bash
# In the terminal running the server:
Press Ctrl+C
```

### Method 2: Force Kill All Processes
```bash
# Kill all Next.js processes
pkill -9 -f "next dev"
pkill -9 -f "node.*next"
```

### Method 3: Kill by Port
```bash
# Kill process on port 3000
lsof -ti :3000 | xargs kill -9

# Kill multiple ports at once
for port in 3000 3001 3002; do
  lsof -ti :$port 2>/dev/null | xargs kill -9 2>/dev/null
done
```

## 🔄 Resetting the Server

### Complete Reset
```bash
# Stop all servers
pkill -9 -f "next dev"

# Clear all caches
rm -rf .next
rm -rf node_modules/.cache

# Restart
npm run dev
```

### Quick Reset
```bash
npm run reset
```

## ⚠️ Common Issues

### "Port 3000 is in use"
**Problem**: Previous server process didn't stop properly

**Solution**:
```bash
# Kill the process using port 3000
lsof -ti :3000 | xargs kill -9

# Or use the clean-start script
./scripts/clean-start.sh
```

### Multiple Servers Running
**Problem**: Server started on ports 3001, 3002, etc.

**Solution**:
```bash
# Kill all node processes
pkill -9 -f "node.*next"

# Clear ports 3000-3010
for port in {3000..3010}; do
  lsof -ti :$port 2>/dev/null | xargs kill -9 2>/dev/null
done

# Restart
npm run dev
```

### "Server Won't Stop with Ctrl+C"
**Problem**: Process is hung or unresponsive

**Solution**:
```bash
# Force kill with -9 signal
pkill -9 -f "next dev"
```

## 📊 Checking Server Status

### Check if Server is Running
```bash
# Test main URL
curl http://localhost:3000

# Check what's using port 3000
lsof -i :3000
```

### Check which ports are in use
```bash
lsof -i :3000 -i :3001 -i :3002
```

## 🎯 Best Practices

### Starting the Server
1. Always check no other servers are running first
2. Use `npm run dev` from the project root
3. Wait for "Ready" message before accessing the app

### Stopping the Server
1. Use Ctrl+C when possible (graceful shutdown)
2. Only use `kill -9` when Ctrl+C fails
3. Always verify the port is free before restarting

### When Things Go Wrong
1. Stop all node processes: `pkill -9 -f node`
2. Clear cache: `rm -rf .next`
3. Fresh start: `npm run dev`

## 🔧 Useful Commands

### Server Management
```bash
# Start
npm run dev

# Stop (in server terminal)
Ctrl+C

# Force stop
pkill -9 -f "next dev"

# Reset and restart
npm run reset
```

### Port Management
```bash
# Check what's on port 3000
lsof -i :3000

# Kill process on port 3000
lsof -ti :3000 | xargs kill -9

# Check all node processes
ps aux | grep node
```

### Cache Management
```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Clear all caches
rm -rf .next node_modules/.cache
```

## 🎉 Quick Reference

| Task | Command |
|------|---------|
| Start server | `npm run dev` |
| Stop server | `Ctrl+C` or `pkill -9 -f "next dev"` |
| Reset server | `npm run reset` |
| Clean start | `./scripts/clean-start.sh` |
| Check port | `lsof -i :3000` |
| Clear cache | `rm -rf .next` |

