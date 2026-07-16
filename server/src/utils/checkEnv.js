// Diagnostic script to check environment variables
console.log("=== Environment Check ===");
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID ? 
  process.env.RAZORPAY_KEY_ID.substring(0, 15) + "..." : "NOT SET");
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET ? 
  "Set (length: " + process.env.RAZORPAY_KEY_SECRET.length + ")" : "NOT SET");
console.log("Key starts with rzp_:", process.env.RAZORPAY_KEY_ID?.startsWith("rzp_"));
console.log("========================");