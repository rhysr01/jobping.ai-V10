# 🌐 CareerJet IP Addresses - Converted from Ranges

**Issue:** CareerJet doesn't accept CIDR ranges, needs individual IPs (max 8)

---

## ✅ VERCEL IP ADDRESSES (Choose 8 from these)

### **From Range: 76.76.21.0/24**

This range includes 256 addresses (76.76.21.0 - 76.76.21.255).

**Pick these 6 representative IPs:**
```
76.76.21.1
76.76.21.50
76.76.21.100
76.76.21.150
76.76.21.200
76.76.21.250
```

### **From Range: 76.223.126.88/29**

This range includes 8 addresses (76.223.126.88 - 76.223.126.95).

**Add these 2:**
```
76.223.126.89
76.223.126.90
```

---

## 📋 FINAL LIST (8 IPs to add to CareerJet):

```
76.76.21.1
76.76.21.50
76.76.21.100
76.76.21.150
76.76.21.200
76.76.21.250
76.223.126.89
76.223.126.90
```

---

## ⚠️ PROBLEM: This Won't Actually Work

**The Issue:**
- Vercel has **256+ possible IPs** in the first range alone
- CareerJet only allows **8 IP addresses**
- Your deployment could use **any IP** in the range
- **These 8 IPs won't cover all possibilities**

---

## 💡 BETTER SOLUTIONS

### **Option 1: Use a Proxy Service (RECOMMENDED)**

Use a service that gives you a **single static IP** for all Vercel requests:

**Services:**
1. **QuotaGuard Static** (easiest)
   - https://www.quotaguard.com/
   - ~$9/month for static IP
   - Add as Vercel integration
   - Get 1 static IP to give CareerJet

2. **Fixie**
   - https://www.usefixie.com/
   - Similar to QuotaGuard
   - Static outbound IP

3. **Cloudflare Workers + Static IP**
   - More complex but free-tier available

---

### **Option 2: Move CareerJet to a Different Server**

Run **only CareerJet scraper** on a server with a static IP:

**Cheap Options:**
1. **DigitalOcean Droplet** ($6/month)
   - Gets 1 static IP
   - Run CareerJet scraper there
   - Keep other scrapers on Vercel

2. **Hetzner Cloud** (€4/month)
   - Same idea, cheaper

3. **AWS EC2 t3.micro** (free tier)
   - Free for 12 months
   - Gets static Elastic IP

---

### **Option 3: Contact CareerJet Support**

Ask them to whitelist the **full CIDR range**:

**Email CareerJet:**
```
Subject: IP Range Whitelisting Request

Hi CareerJet Team,

I'm deploying on Vercel (serverless platform) which uses dynamic IPs 
from these ranges:

76.76.21.0/24
76.223.126.88/29

Can you whitelist these full ranges instead of individual IPs?
Or increase my IP limit to accommodate serverless deployment?

Thanks!
```

---

### **Option 4: Try the 8 IPs Anyway (Quick Test)**

**It might work if you get lucky:**

Add these 8 IPs:
```
76.76.21.1
76.76.21.50
76.76.21.100
76.76.21.150
76.76.21.200
76.76.21.250
76.223.126.89
76.223.126.90
```

Then run your scraper **multiple times**:
- If it works → you got lucky with IP assignment
- If it fails → you need Option 1, 2, or 3

---

## 🚀 MY RECOMMENDATION

**Best approach for JobPing:**

1. **Short-term (Today):**
   - Try the 8 IPs above
   - Test immediately
   - If it fails, disable CareerJet temporarily

2. **Long-term (This Week):**
   - **Option A:** Add QuotaGuard Static to Vercel ($9/month)
     - Quick setup
     - Professional solution
     - Works for all scrapers
   
   - **Option B:** Move CareerJet to $6 DigitalOcean droplet
     - Cheapest long-term
     - More control
     - Dedicated scraper server

---

## 📊 COST COMPARISON

| Solution | Setup Time | Monthly Cost | Reliability |
|----------|------------|--------------|-------------|
| **8 Random IPs** | 5 min | Free | 20% chance |
| **QuotaGuard** | 30 min | $9 | 99.9% |
| **DigitalOcean** | 2 hours | $6 | 99.9% |
| **Contact Support** | 1-3 days | Free | Unknown |

---

## ✅ IMMEDIATE ACTION

**For right now, try these 8 IPs:**

```
76.76.21.1
76.76.21.50
76.76.21.100
76.76.21.150
76.76.21.200
76.76.21.250
76.223.126.89
76.223.126.90
```

**Then test:**
```bash
node scrapers/careerjet.cjs
```

**If it works:** Great! Keep monitoring.  
**If it fails:** Set up QuotaGuard Static this week.

---

## 🔧 QUICKGUARD SETUP (If Needed)

1. Go to https://www.quotaguard.com/
2. Sign up for "Static IP" plan
3. Get your static IP
4. Add to Vercel as environment variable
5. Update CareerJet scraper to use proxy
6. Add QuotaGuard's **1 static IP** to CareerJet
7. Done! ✅

---

**Want me to help you set up QuotaGuard if the 8 IPs don't work?**
