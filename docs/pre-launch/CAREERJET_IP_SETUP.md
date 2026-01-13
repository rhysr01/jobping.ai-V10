# 🌐 Finding Your IP Address for CareerJet API

**Purpose:** CareerJet requires your server IP address(es) to whitelist API access

---

## 🔍 WHICH IP ADDRESS DO YOU NEED?

Since JobPing runs on **Vercel** (serverless), you need to provide **Vercel's IP ranges**, not your local IP.

---

## 📍 OPTION 1: VERCEL IP RANGES (RECOMMENDED)

### **For Production (Vercel Deployment):**

Vercel uses **dynamic IP addresses** that change, so you need to provide their **IP ranges**:

**Vercel's Official IP Ranges:**
```
76.76.21.0/24
76.223.126.88/29
```

**Source:** [Vercel IP Allowlist Documentation](https://vercel.com/guides/how-to-allowlist-deployment-ip-address)

### **How to Add to CareerJet:**

1. Go to CareerJet API settings
2. Enter these IP ranges:
   ```
   76.76.21.0/24
   76.223.126.88/29
   ```
3. Save

**Note:** CareerJet allows up to 8 IP addresses/ranges, so these 2 ranges are fine.

---

## 📍 OPTION 2: YOUR LOCAL IP (FOR TESTING ONLY)

### **If Testing Locally:**

**On Mac/Linux:**
```bash
curl https://api.ipify.org
# OR
curl https://ifconfig.me
# OR
dig +short myip.opendns.com @resolver1.opendns.com
```

**On Windows:**
```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```

**Via Website:**
- Visit: https://www.whatismyip.com/
- Copy the IPv4 address shown

---

## 📍 OPTION 3: GITHUB ACTIONS IP RANGES (IF RUNNING VIA CI/CD)

If your scraper runs via GitHub Actions:

**GitHub Actions IP Ranges:**
```
See: https://api.github.com/meta
Look for: "actions" array
```

GitHub provides a JSON endpoint with current IP ranges. You'd need to:
1. Download: `curl https://api.github.com/meta | jq .actions`
2. Add all IPs to CareerJet (up to 8)

**Example GitHub Actions IPs:**
```
4.175.114.51/32
13.64.151.161/32
13.65.240.240/32
# ... (varies, changes frequently)
```

---

## ✅ RECOMMENDED SETUP FOR JOBPING

Since you're running on **Vercel** in production:

### **Add These to CareerJet:**

```
IP Range 1: 76.76.21.0/24
IP Range 2: 76.223.126.88/29
```

### **Steps:**

1. **Login to CareerJet API Portal**
   - Go to: https://www.careerjet.com/partners/api/

2. **Find "Server IP Address" Section**
   - Should allow up to 8 entries

3. **Enter Vercel IP Ranges:**
   ```
   76.76.21.0/24
   76.223.126.88/29
   ```

4. **Save Changes**

5. **Test Your API:**
   ```bash
   # Test from your Vercel deployment
   node scrapers/careerjet.cjs
   ```

---

## 🐛 TROUBLESHOOTING

### **If CareerJet Blocks Your Requests:**

**Error:** "IP address not whitelisted" or similar

**Solutions:**

1. **Verify IP Ranges Added:**
   - Check CareerJet dashboard shows both ranges
   - Wait 5-10 minutes for changes to propagate

2. **Check Your Actual Deployment IP:**
   ```bash
   # Add this to your scraper temporarily:
   const axios = require('axios');
   const myIp = await axios.get('https://api.ipify.org');
   console.log('🌐 Current IP:', myIp.data);
   ```

3. **If IP Doesn't Match Vercel Ranges:**
   - You might be using a different deployment platform
   - Add the actual IP shown to CareerJet

---

## 📊 PLATFORM-SPECIFIC IPS

| Platform | IP Address Type | What to Add |
|----------|-----------------|-------------|
| **Vercel** | Dynamic (ranges) | `76.76.21.0/24`, `76.223.126.88/29` |
| **Heroku** | Dynamic | Varies by region, check [Heroku IP ranges](https://devcenter.heroku.com/articles/platform-api-reference#outbound-ip-addresses) |
| **Railway** | Dynamic | Contact Railway support for IP ranges |
| **DigitalOcean** | Static | Your droplet's fixed IP |
| **AWS EC2** | Static/Elastic | Your instance's Elastic IP |
| **Local Dev** | Your home IP | Visit whatismyip.com |

---

## 🚀 QUICK ANSWER FOR YOU

**For JobPing on Vercel, add these to CareerJet:**

```
76.76.21.0/24
76.223.126.88/29
```

**That's it!** ✅

---

## 💡 PRO TIP

If CareerJet gives you trouble with IP ranges, you can also:

1. **Deploy a single Vercel function** that acts as a proxy
2. **Give it a fixed IP** using a service like [QuotaGuard](https://www.quotaguard.com/)
3. **Add that single static IP** to CareerJet

But the Vercel IP ranges above should work fine for most cases.

---

## 📝 NEED YOUR ACTUAL IP RIGHT NOW?

**Visit:** https://www.whatismyip.com/

**Or run this locally:**
```bash
curl https://api.ipify.org && echo
```

**Then add that IP to CareerJet for local testing.**

---

## ✅ CHECKLIST

- [ ] Add `76.76.21.0/24` to CareerJet
- [ ] Add `76.223.126.88/29` to CareerJet  
- [ ] Save changes in CareerJet dashboard
- [ ] Wait 5-10 minutes for propagation
- [ ] Test: `node scrapers/careerjet.cjs`
- [ ] Verify no "IP blocked" errors in logs

**Done!** 🎉
