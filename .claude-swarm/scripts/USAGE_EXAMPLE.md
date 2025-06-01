# Beta Test Script Usage Example

## 🧪 **Enhanced Beta Test Checklist**

The script now includes **manual testing prompts** + **automated validation**!

### **Running the Script**:

```bash
./.claude-swarm/scripts/beta-test-checklist.sh
```

### **What You'll See**:

```bash
🧪 PLATE RESTAURANT BETA TEST CHECKLIST
======================================

1. GUEST ACCESS TEST
   [ ] Click 'Sign in as Guest' - Works?
   [ ] See welcome screen - Displays?
   [ ] See dashboard - All cards visible?

2. SERVER INTERFACE TEST
   [ ] Navigate to Server - No errors?
   [ ] See floor plan - TABLES VISIBLE?
   [ ] Click a table - Modal opens?
   [ ] Place order - Reaches kitchen?

3. KITCHEN DISPLAY TEST
   [ ] Navigate to Kitchen - Loads?
   [ ] See orders - Display correctly?
   [ ] Update status - Works?

4. ADMIN FLOOR PLAN TEST
   [ ] Open floor plan editor - NO CRASH?
   [ ] Drag a table - Moves smoothly?
   [ ] Save changes - Persists?

5. PERFORMANCE TEST
   [ ] All pages load <3 seconds?
   [ ] Console shows 0 errors?
   [ ] Animations smooth?

Run automated checks? (y/n)
```

### **Two Options**:

#### **Option 1: Manual Testing Only**

Press `n` to skip automated checks and just use the manual checklist

#### **Option 2: Full Validation**

Press `y` to run:

1. **TypeScript compilation check**
2. **Complete automated system validation**
3. **Performance monitoring**
4. **Security scanning**

### **Perfect for Beta Testing**:

#### **Daily Morning Check**:

```bash
# Full validation before starting work
./.claude-swarm/scripts/beta-test-checklist.sh
# Press 'y' for complete validation
```

#### **Quick Beta User Check**:

```bash
# Just manual checklist for beta testers
./.claude-swarm/scripts/beta-test-checklist.sh
# Press 'n' to skip automation, use manual list
```

#### **Pre-Commit Validation**:

```bash
# Full system check before committing
./.claude-swarm/scripts/beta-test-checklist.sh
# Press 'y' for complete validation
```

## 🎯 **Benefits**:

### **For Developers**:

- **Manual checklist** guides critical testing
- **Automated validation** catches technical issues
- **Combined approach** ensures nothing is missed

### **For Beta Testers**:

- **Clear test steps** for each major feature
- **Easy to follow** checkbox format
- **Covers all critical workflows**

### **For Quality Assurance**:

- **Comprehensive coverage** of all features
- **Performance validation** included
- **Security and reliability** checks automated

## 🚀 **Result**:

Perfect hybrid approach combining **human testing intuition** with **automated technical validation**!

**Status**: Ready for daily beta testing use ✅
