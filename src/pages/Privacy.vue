<template>
  <main class="section py-20">
    <div class="max-w-3xl mx-auto glass-card glass-panel p-8 md:p-10 rounded-2xl border border-white/10 shadow-2xl">
      <h1 class="text-4xl font-extrabold mb-6 text-white bg-gradient-to-r from-eter-accent to-purple-400 bg-clip-text text-transparent">
        Privacy Policy
      </h1>

      <div class="space-y-8 text-white/85 leading-relaxed">
        <section>
          <p>
            Welcome to <b>Eterium</b>. This Privacy Policy explains how we collect, use, and protect your personal data while you use
            our platform and website (<a href="https://www.eterium.space" class="link">https://www.eterium.space</a>).
          </p>
        </section>

        <section>
          <h2 class="subtitle">1. Information We Collect</h2>
          <ul class="list-disc pl-6 space-y-1">
            <li><b>Account data:</b> username, email, and avatar (if uploaded).</li>
            <li><b>Authentication:</b> securely handled via Supabase; we never store plain passwords.</li>
            <li><b>Payment info:</b> donation metadata (amount, transaction ID); we never store card details.</li>
            <li><b>Usage data:</b> pages visited, browser type, approximate region (if analytics is enabled).</li>
          </ul>
        </section>

        <div class="divider"></div>

        <section>
          <h2 class="subtitle">2. How We Use It</h2>
          <ul class="list-disc pl-6 space-y-1">
            <li>To maintain your account and profile.</li>
            <li>To deliver rewards, achievements, and in-game features.</li>
            <li>To send account notifications (friends, drops, messages, rewards).</li>
            <li>To improve user experience and platform stability.</li>
          </ul>
        </section>

        <div class="divider"></div>

        <section>
          <h2 class="subtitle">3. Data Storage & Security</h2>
          <p>
            Your data is securely stored on <b>Supabase</b> infrastructure with end-to-end encryption (HTTPS/TLS).  
            We use strict security rules and access controls to prevent unauthorized access or disclosure.
          </p>
        </section>

        <div class="divider"></div>

        <section>
          <h2 class="subtitle">4. Data Sharing</h2>
          <p>
            We never sell, rent, or trade user data.  
            Data is shared only with trusted infrastructure providers (Supabase, Render) for hosting and maintenance.
          </p>
        </section>

        <div class="divider"></div>

        <section>
          <h2 class="subtitle">5. Your Rights</h2>
          <ul class="list-disc pl-6 space-y-1">
            <li>Request a copy of your stored data.</li>
            <li>Request correction or deletion of your account.</li>
            <li>Withdraw consent for optional email notifications.</li>
          </ul>
          <p>
            To exercise these rights, contact us at
            <a href="mailto:privacy@eterium.space" class="link">privacy@eterium.space</a>.
          </p>
        </section>

        <div class="divider"></div>

        <section>
          <h2 class="subtitle">6. Account Ownership & Restrictions</h2>
          <ul class="list-disc pl-6 space-y-1">
            <li>Your Eterium account is personal and non-transferable.</li>
            <li><b>Selling, trading, gifting, or transferring profiles is strictly prohibited.</b></li>
            <li>Violations may result in account suspension or permanent ban.</li>
          </ul>
        </section>

        <div class="divider"></div>

        <section>
          <h2 class="subtitle">7. Children’s Privacy</h2>
          <p>
            Eterium is not directed to users under 13.  
            We do not knowingly collect information from minors. If such data is found, it will be deleted immediately.
          </p>
        </section>

        <div class="divider"></div>

        <section>
          <h2 class="subtitle">8. Updates</h2>
          <p>
            This Privacy Policy may be updated periodically. The date below shows the latest revision.  
            Continued use of Eterium means you accept the updated version.
          </p>
        </section>

        <section>
          <h2 class="subtitle">9. Contact</h2>
          <p>
            For privacy inquiries, please reach out to  
            <a href="mailto:privacy@eterium.space" class="link">privacy@eterium.space</a>.
          </p>
          <p class="text-sm text-white/50 mt-3">Last updated: November 2025</p>
        </section>
      </div>

      <RouterLink to="/" class="cta mt-10 inline-block">Back to Home</RouterLink>
    </div>
  </main>
</template>

<script setup lang="ts"></script>

<style scoped>
.glass-card {
  background: radial-gradient(
      120% 120% at 10% -20%,
      rgba(160, 190, 255, 0.08),
      rgba(255, 255, 255, 0) 60%
    ),
    linear-gradient(180deg, rgba(18, 20, 26, 0.9), rgba(12, 14, 18, 0.9));
  border-radius: 20px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
}

.subtitle {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
  background: linear-gradient(90deg, #a0c8ff, #c5b3ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 1.8rem 0;
}

.link {
  color: #a5c8ff;
  text-decoration: underline dotted;
}
.link:hover {
  color: #fff;
}
</style>
