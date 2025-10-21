<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  const links = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
  links.forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href')?.substring(1)
      const target = document.getElementById(targetId || '')
      if (target) {
        e.preventDefault()
        const headerOffset = 80 // adjust to match your header height
        const elementPosition = target.getBoundingClientRect().top + window.scrollY
        const offsetPosition = elementPosition - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    })
  })
})
</script>


<template>
  <main class="section py-8 max-w-4xl mx-auto mt-10 pl-0 pr-0">
    <h1 class="title">Legal</h1>

    <!-- quick toc -->
    <nav class="toc card mt-4">
      <div class="toc-title">On this page</div>
      <ul class="toc-list">
        <li>
          <a href="#content-policy">User Content & Acceptable Use Policy</a>
        </li>
        <li><a href="#tos">Terms of Service (short)</a></li>
        <li><a href="#privacy">Privacy (short)</a></li>
        <!-- <li><a href="#contact">Contacts</a></li> -->
      </ul>
    </nav>

    <!-- CONTENT POLICY -->
    <section id="content-policy" class="card mt-6 p-5 md:p-6">
      <h2 class="h2">User Content & Acceptable Use Policy</h2>
      <p class="lead">
        We want Eterium to remain a safe and lawful space. Below are the types
        of content that are
        <b>prohibited</b> from uploading or publishing (including avatars,
        names, descriptions, etc.).
      </p>

      <ul class="bullets">
        <li>
          <b>Pornography and explicit nudity.</b> Sexual acts, close-ups of
          genitals, sexualized violence.
        </li>
        <li>
          <b>Any content involving minors (CSAM).</b> Including deepfake or
          drawn — zero tolerance.
        </li>
        <li><b>Incitement to violence, terrorism, or hatred.</b></li>
        <li><b>Copyright, trademark, or likeness violations.</b></li>
        <li>
          <b>Publishing personal data.</b> Documents, addresses, or medical data
          without consent or legal basis.
        </li>
        <li>
          <b>Any other illegal content</b> under the laws of your jurisdiction
          or our providers.
        </li>
      </ul>

      <p>
        We use both <b>automated</b> and <b>manual moderation</b>. Content
        violating this policy may be removed; accounts may be restricted or
        suspended, especially for repeated violations.
      </p>

      <h3 class="h3 mt-5">Reports and Takedowns</h3>
      <p>
        If you notice a violation, use the <b>Report</b> button (when available)
        or email
        <a class="link" href="mailto:abuse@eterium.app">abuse@eterium.app</a> —
        we will review and take action promptly.
      </p>

      <h3 class="h3 mt-5">Age Restrictions</h3>
      <p>
        Eterium is intended for users aged 13 and older. Any sexual content is
        strictly prohibited. Materials involving minors will be immediately
        removed, with notifications sent to the competent authorities where
        required by law.
      </p>

      <div class="note mt-5 glass-card glass-panel">
        By uploading content, you confirm that you have the right to share it
        and that it complies with this policy.
      </div>
    </section>

    <!-- TOS (short) -->
    <section id="tos" class="card mt-6 p-5 md:p-6">
      <h2 class="h2">Terms of Service — Summary</h2>
      <ul class="bullets">
        <li>
          You agree to use the service within the law and this Content Policy.
        </li>
        <li>
          We may modify functionality, suspend, or discontinue the service (with
          notice where possible).
        </li>
        <li>
          Violations may result in warnings, restrictions, removal of materials,
          or account termination.
        </li>
        <li>
          The service is provided “as is,” without warranties of fitness for a
          particular purpose.
        </li>
        <li>
          Applicable law and dispute resolution follow the governing law
          (specify your jurisdiction here).
        </li>
      </ul>
      <p class="muted">
        The full Terms of Service will be published later. Until then, the rules
        on this page apply.
      </p>
    </section>

    <!-- Privacy (short) -->
    <section id="privacy" class="card mt-6 p-5 md:p-6">
      <h2 class="h2">Privacy — Summary</h2>
      <ul class="bullets">
        <li>
          We store only the minimum data necessary to operate the service (e.g.,
          email, nickname, avatar).
        </li>
        <li>
          Cookies and analytics may be used to improve performance (details will
          be described in the full policy).
        </li>
        <li>
          You can request deletion of your account and data where permitted by
          law.
        </li>
      </ul>
      <p class="muted">
        A detailed Privacy Policy will be published separately. Until then, the
        basic principles described here apply.
      </p>
    </section>
 <div class="glass-card glass-panel p-5 md:p-6 mt-5">
        <h3 class="h3 mb-3">What it means for players</h3>
        <ul class="bullets">
          <li>
             Keep your content safe and lawful; violations may be removed and
            accounts restricted.
          </li>
          <li>
             Respect others’ rights: no copyrighted materials, trademarks, or
            personal data without consent.
          </li>
          <li>
             Use the Report button or write to
            <a class="link" href="mailto:abuse@eterium.app"
              >abuse@eterium.app</a
            >
            to flag violations.
          </li>
          <li>
             Eterium is 13+; sexual content is not allowed and CSAM is strictly
            prohibited.
          </li>
        </ul>
      </div>
    <!-- Contacts
    <section id="contact" class="card mt-6 p-5 md:p-6">
      <h2 class="h2">Contacts</h2>
      <p>
        For legal inquiries:
        <a class="link" href="mailto:legal@eterium.app">legal@eterium.app</a
        ><br />
        For content complaints:
        <a class="link" href="mailto:abuse@eterium.app">abuse@eterium.app</a>
      </p>
      
    </section> -->
   
  </main>
</template>

<style scoped>
.title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: rgba(255, 255, 255, 0.98);
}

.card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: radial-gradient(
      120% 120% at 10% -20%,
      rgba(160, 190, 255, 0.08),
      rgba(255, 255, 255, 0) 60%
    ),
    linear-gradient(180deg, rgba(18, 20, 26, 0.9), rgba(12, 14, 18, 0.9));
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
}
.h2 {
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.96);
}
.h3 {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.96);
}
.lead {
  color: rgba(255, 255, 255, 0.88);
  margin-top: 0.25rem;
}

.bullets {
  margin-top: 0.6rem;
  list-style: disc;
  padding-left: 1.1rem;
  color: rgba(255, 255, 255, 0.88);
}
.bullets li {
  margin: 0.35rem 0;
}

.link {
  color: #cfe0ff;
  text-decoration: underline dotted;
}
.link:hover {
  color: #fff;
}
.muted {
  color: rgba(255, 255, 255, 0.65);
}

.toc {
  padding: 0.8rem 0.9rem;
}
.toc-title {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  margin-bottom: 0.4rem;
}
.toc-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  font-size: 14px;
}
.toc-list a {
  color: rgba(255, 255, 255, 0.85);
}
.toc-list a:hover {
  color: #fff;
  text-decoration: underline;
}

.note {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  padding: 0.7rem 0.85rem;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
}
.mt-4 {
  margin-top: 1rem;
}
.mt-5 {
  margin-top: 1.25rem;
}
.mt-6 {
  margin-top: 1.5rem;
}
.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}
</style>
