import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, Copy, Mail, Send, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaLinkedin, FaWhatsapp } from 'react-icons/fa6';
import { profile } from '../../content/profile.js';
import { intlLocale } from '../../i18n/locales.js';
import { CONTACT_LIMITS, contactSchema } from '../../lib/contact-schema.js';
import { formatPhone, isEmailConfigured, sendContactEmails } from '../../lib/email.js';
import { useLocale } from '../../lib/hooks.js';
import { siteConfig } from '../../site.config.js';
import { AppScroll, SectionTitle } from '../ui/AppSection.jsx';
import { Button } from '../ui/Button.jsx';
import { Spinner } from '../ui/Spinner.jsx';

/** Contato: canais clicáveis + formulário com validação e envio por e-mail (§10.6). */
export default function Contact() {
  const { t } = useTranslation();
  return (
    <AppScroll>
      <header>
        <h3 className="text-xl font-semibold tracking-tight">{t('contact.heading')}</h3>
        <p className="text-sm text-muted">{t('contact.subtitle')}</p>
      </header>
      <Channels />
      <ContactForm />
    </AppScroll>
  );
}

function Channels() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const whatsappText = t('contact.whatsappMessage', { name: siteConfig.author.firstName });

  const channels = [
    {
      id: 'email',
      label: t('contact.email'),
      value: profile.email,
      href: `mailto:${profile.email}`,
      icon: <Mail className="size-5" />,
      tint: '#5a67f2',
    },
    {
      id: 'whatsapp',
      label: t('contact.whatsapp'),
      value: formatPhone(profile.whatsapp),
      href: `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(whatsappText)}`,
      icon: <FaWhatsapp className="size-5" />,
      tint: '#25a35a',
      external: true,
    },
    {
      id: 'linkedin',
      label: t('contact.linkedin'),
      value: profile.links.linkedin.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''),
      href: profile.links.linkedin,
      icon: <FaLinkedin className="size-5" />,
      tint: '#2a6db5',
      external: true,
    },
    {
      id: 'github',
      label: t('contact.github'),
      value: profile.links.github.replace(/^https:\/\//, ''),
      href: profile.links.github,
      icon: <FaGithub className="size-5" />,
      tint: '#24292f',
      external: true,
    },
  ];

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o link mailto continua disponível.
    }
  }

  return (
    <section aria-labelledby="contact-channels" className="mt-6">
      <SectionTitle id="contact-channels">{t('contact.channels')}</SectionTitle>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {channels.map((channel) => (
          <li key={channel.id} className="relative">
            <a
              href={channel.href}
              data-channel={channel.id}
              {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-surface-2 p-3 pr-12 transition-colors hover:border-border-strong"
            >
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-[10px] text-white"
                style={{ background: channel.tint }}
              >
                {channel.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{channel.label}</span>
                <span className="block truncate text-xs text-muted">{channel.value}</span>
              </span>
              {channel.external && <span className="sr-only">{t('common.newTab')}</span>}
            </a>
            {channel.id === 'email' && (
              <button
                type="button"
                onClick={copyEmail}
                aria-label={t('contact.copyEmail')}
                title={t('contact.copyEmail')}
                className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-[8px] text-muted hover:bg-border hover:text-text"
              >
                {copied ? (
                  <CircleCheck className="size-4 text-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            )}
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="sr-only">
        {copied ? t('contact.emailCopied') : ''}
      </p>
    </section>
  );
}

function ContactForm() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [status, setStatus] = useState('idle'); // idle | success | error | unavailable
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', message: '', website: '' },
  });
  const messageLength = useWatch({ control, name: 'message' })?.length ?? 0;

  async function onSubmit(values) {
    // Honeypot preenchido: provavelmente um robô. Finge sucesso e não envia.
    if (values.website) {
      setStatus('success');
      reset();
      return;
    }
    if (!isEmailConfigured()) {
      setStatus('unavailable');
      return;
    }
    try {
      await sendContactEmails({
        name: values.name,
        email: values.email,
        message: values.message,
        time: new Date().toLocaleString(intlLocale(locale)),
        titles: {
          forMe: t('contact.form.subjectForMe', { name: values.name }),
          forSender: t('contact.form.subjectForSender'),
        },
      });
      setStatus('success');
      reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <section
        role="status"
        className="mt-8 flex flex-col items-center gap-3 rounded-md border border-border bg-surface-2 p-6 text-center"
      >
        <CircleCheck aria-hidden className="size-8 text-success" />
        <p className="text-sm font-medium">{t('contact.form.success')}</p>
        <Button size="sm" onClick={() => setStatus('idle')}>
          {t('contact.form.sendAnother')}
        </Button>
      </section>
    );
  }

  const fieldError = (name) =>
    errors[name] ? (
      <p id={`contact-${name}-error`} className="text-xs text-danger">
        {t(errors[name].message)}
      </p>
    ) : null;

  const inputClass = (name) =>
    `w-full rounded-sm border bg-surface px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-accent ${
      errors[name] ? 'border-danger' : 'border-border'
    }`;

  return (
    <section aria-labelledby="contact-form-title" className="mt-8">
      <SectionTitle id="contact-form-title">{t('contact.form.title')}</SectionTitle>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="relative mt-3 flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-name" className="text-sm font-medium">
              {t('contact.form.name')}
            </label>
            <input
              id="contact-name"
              autoComplete="name"
              placeholder={t('contact.form.namePlaceholder')}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'contact-name-error' : undefined}
              className={inputClass('name')}
              {...register('name')}
            />
            {fieldError('name')}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-email" className="text-sm font-medium">
              {t('contact.form.email')}
            </label>
            <input
              id="contact-email"
              type="email"
              autoComplete="email"
              placeholder={t('contact.form.emailPlaceholder')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'contact-email-error' : undefined}
              className={inputClass('email')}
              {...register('email')}
            />
            {fieldError('email')}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="contact-message" className="text-sm font-medium">
              {t('contact.form.message')}
            </label>
            <span className="text-xs text-muted tabular-nums" aria-hidden>
              {t('contact.form.counter', { count: messageLength, max: CONTACT_LIMITS.message.max })}
            </span>
          </div>
          <textarea
            id="contact-message"
            rows={5}
            placeholder={t('contact.form.messagePlaceholder')}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
            className={`${inputClass('message')} resize-y`}
            {...register('message')}
          />
          {fieldError('message')}
        </div>

        {/* Honeypot: fora da tela e fora da navegação por teclado. */}
        <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label htmlFor="contact-website">{t('contact.form.honeypot')}</label>
          <input id="contact-website" tabIndex={-1} autoComplete="off" {...register('website')} />
        </div>

        {(status === 'error' || status === 'unavailable') && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-sm border border-danger/40 bg-danger/10 p-3 text-sm"
          >
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
            <span>
              {t(status === 'error' ? 'contact.form.error' : 'contact.form.unavailable')}{' '}
              <a href={`mailto:${profile.email}`} className="font-medium text-accent-ink underline">
                {profile.email}
              </a>
            </span>
          </p>
        )}

        <Button type="submit" variant="primary" disabled={isSubmitting} className="self-start">
          {isSubmitting ? <Spinner /> : <Send aria-hidden className="size-4" />}
          {isSubmitting ? t('contact.form.sending') : t('contact.form.submit')}
        </Button>
      </form>
    </section>
  );
}
