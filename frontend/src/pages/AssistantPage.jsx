import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Compass,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Bot,
  User,
  ShieldCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

/**
 * Custom Markdown Renderer for Assistant Responses
 * Formats headings, lists, bold text, links, code blocks, and tables
 * to match CiviConnect's public-service green & ivory design.
 */
const AssistantMarkdown = ({ content }) => {
  return (
    <div className="assistant-markdown-content" style={{ wordBreak: 'break-word', lineHeight: 1.6 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-forest-dark)', marginTop: '0.85rem', marginBottom: '0.4rem', lineHeight: 1.3 }} {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-forest-dark)', marginTop: '0.75rem', marginBottom: '0.35rem', lineHeight: 1.3 }} {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-forest)', marginTop: '0.65rem', marginBottom: '0.3rem', lineHeight: 1.35 }} {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-forest)', marginTop: '0.5rem', marginBottom: '0.25rem' }} {...props} />
          ),
          p: ({ node, ...props }) => (
            <p style={{ marginBottom: '0.65rem', color: 'inherit', fontSize: '0.925rem', lineHeight: 1.65 }} {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul style={{ paddingLeft: '1.35rem', marginBottom: '0.65rem', listStyleType: 'disc' }} {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol style={{ paddingLeft: '1.35rem', marginBottom: '0.65rem', listStyleType: 'decimal' }} {...props} />
          ),
          li: ({ node, ...props }) => (
            <li style={{ marginBottom: '0.35rem', lineHeight: 1.6 }} {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong style={{ fontWeight: 700, color: 'var(--color-forest-dark)' }} {...props} />
          ),
          em: ({ node, ...props }) => (
            <em style={{ fontStyle: 'italic' }} {...props} />
          ),
          a: ({ node, href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-forest)',
                textDecoration: 'underline',
                fontWeight: 600,
                wordBreak: 'break-all'
              }}
              {...props}
            >
              {children}
            </a>
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote style={{
              borderLeft: '3px solid var(--color-forest)',
              paddingLeft: '0.75rem',
              margin: '0.65rem 0',
              color: 'var(--color-forest-light)',
              fontStyle: 'italic'
            }} {...props} />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code
                  style={{
                    backgroundColor: 'rgba(24, 55, 43, 0.08)',
                    padding: '0.15rem 0.35rem',
                    borderRadius: 'var(--radius-xs)',
                    fontFamily: 'monospace',
                    fontSize: '0.85em',
                    color: 'var(--color-forest-dark)'
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre style={{
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto',
                margin: '0.65rem 0',
                fontSize: '0.85rem'
              }}>
                <code style={{ fontFamily: 'monospace' }} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          table: ({ node, ...props }) => (
            <div style={{ overflowX: 'auto', margin: '0.75rem 0' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-xs)',
                overflow: 'hidden'
              }} {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead style={{ backgroundColor: 'var(--color-forest-surface)', borderBottom: '2px solid var(--color-forest-border)' }} {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr style={{ borderBottom: '1px solid var(--color-border)' }} {...props} />
          ),
          th: ({ node, ...props }) => (
            <th style={{
              padding: '0.5rem 0.75rem',
              textAlign: 'left',
              fontWeight: 600,
              color: 'var(--color-forest-dark)'
            }} {...props} />
          ),
          td: ({ node, ...props }) => (
            <td style={{
              padding: '0.5rem 0.75rem',
              borderBottom: '1px solid var(--color-border)'
            }} {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1rem 0' }} {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const AssistantPage = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [messages, setMessages] = useState([
    {
      id: 'initial',
      role: 'assistant',
      content: language === 'pa'
        ? "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ CiviConnect ਦਾ ਸਰਕਾਰੀ ਸਕੀਮ ਸਹਾਇਕ ਹਾਂ। ਤੁਸੀਂ ਪੰਜਾਬ ਜਾਂ ਕੇਂਦਰ ਸਰਕਾਰ ਦੀ ਕਿਸੇ ਵੀ ਸਕੀਮ, ਵਜ਼ੀਫ਼ੇ ਜਾਂ ਯੋਗਤਾ ਬਾਰੇ ਪੰਜਾਬੀ, ਹਿੰਦੀ ਜਾਂ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਪੁੱਛ ਸਕਦੇ ਹੋ।"
        : language === 'hi'
        ? "नमस्ते! मैं CiviConnect का सरकारी योजना सहायक हूँ। आप केंद्र या पंजाब सरकार की किसी भी योजना, छात्रवृत्ति या पात्रता के बारे में हिंदी, पंजाबी या अंग्रेजी में पूछ सकते हैं।"
        : "Welcome to CiviConnect! I am your independent public service navigator. You can ask me about scholarships, farmer welfare, pensions, health schemes, or required documents in English, Hindi, or Punjabi.",
      grounded_schemes: [],
      provider_status: 'live'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerStatus, setProviderStatus] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.assistant.getStatus()
      .then((stat) => setProviderStatus(stat))
      .catch((err) => console.log('Assistant status check:', err));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const response = await api.assistant.chat(
        text.trim(),
        'active-session',
        language,
        user?.profile || null
      );

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        grounded_schemes: response.grounded_schemes || [],
        provider_status: response.provider_status,
        diagnostic: response.diagnostic_message,
        suggested_followups: response.suggested_followups || []
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      addToast(err.message || 'Failed to send message', 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I encountered an error connecting to the service. Please verify backend connectivity.',
          grounded_schemes: [],
          provider_status: 'error'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'initial',
        role: 'assistant',
        content: language === 'pa'
          ? "ਨਵੀਂ ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਹੋਈ ਹੈ। ਮੈਂ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਬਾਰੇ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?"
          : language === 'hi'
          ? "नई बातचीत शुरू हुई। मैं सरकारी योजनाओं के बारे में आपकी क्या मदद कर सकता हूँ?"
          : "Fresh consultation started. How can I assist you with government schemes today?",
        grounded_schemes: []
      }
    ]);
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 160px)', paddingBottom: '2.5rem' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', flex: 1, maxWidth: '920px', width: '100%' }}>
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div className="editorial-kicker">Grounded Conversational Intelligence</div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--color-forest-dark)' }}>
              {t('assistant.title')}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Status Indicator Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: providerStatus?.status === 'ready' ? '#DCFCE7' : '#FEF3C7',
              color: providerStatus?.status === 'ready' ? '#166534' : '#92400E',
              border: `1px solid ${providerStatus?.status === 'ready' ? '#86EFAC' : '#FCD34D'}`
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: providerStatus?.status === 'ready' ? '#16A34A' : '#D97706'
              }} />
              <span>{providerStatus?.status === 'ready' ? 'Live Gemini 3.8 Flash' : 'Grounded DB Navigator'}</span>
            </div>

            <button onClick={handleResetChat} className="btn btn-secondary btn-sm" title="Clear conversation">
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Advisory banner */}
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--color-forest-dark)',
          backgroundColor: 'var(--color-forest-surface)',
          border: '1px solid var(--color-forest-border)',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <ShieldCheck size={14} color="var(--color-forest)" />
          <span>{t('assistant.disclaimer')}</span>
        </div>

        {/* Chat History Panel */}
        <div style={{
          backgroundColor: 'var(--color-ivory-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          marginBottom: '1.25rem',
          minHeight: '340px'
        }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: msg.role === 'user' ? 'var(--color-terracotta)' : 'var(--color-forest)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Content Bubble */}
              <div style={{
                maxWidth: '85%',
                backgroundColor: msg.role === 'user' ? 'var(--color-forest-surface)' : 'var(--color-ivory)',
                border: `1px solid ${msg.role === 'user' ? 'var(--color-forest-border)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.15rem',
                fontSize: '0.925rem',
                lineHeight: 1.6,
                color: 'var(--color-text-main)',
                overflowWrap: 'break-word',
                wordBreak: 'break-word'
              }}>
                {msg.role === 'user' ? (
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content}
                  </div>
                ) : (
                  <AssistantMarkdown content={msg.content} />
                )}

                {/* Verified Grounded Schemes Chips */}
                {msg.grounded_schemes && msg.grounded_schemes.length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-strong)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-forest-dark)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Verified Grounded Schemes:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {msg.grounded_schemes.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-xs)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.825rem',
                            gap: '0.5rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '180px' }}>
                            <strong>{s.name}</strong>
                            {s.benefits_summary && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {s.benefits_summary}
                              </div>
                            )}
                          </div>
                          <Link to={`/schemes/${s.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>
                            <span>Details</span>
                            <ExternalLink size={10} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Friendly Notice when in database fallback or temporary error */}
                {msg.diagnostic && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    marginTop: '0.65rem',
                    padding: '0.45rem 0.65rem',
                    backgroundColor: 'var(--color-ivory-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <ShieldCheck size={14} color="var(--color-forest)" style={{ flexShrink: 0 }} />
                    <span>
                      {msg.diagnostic.includes('429') || msg.diagnostic.includes('RESOURCE_EXHAUSTED') || msg.diagnostic.includes('quota')
                        ? 'The live AI service is currently at capacity. Showing verified database results directly from official government records.'
                        : msg.diagnostic}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--color-forest)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} />
              </div>
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-ivory)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Retrieving verified government schemes and generating grounded response...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {[
            'Scholarships in Punjab for college students',
            'PM-KISAN eligibility criteria',
            'Ayushman Bharat hospital benefits',
            'Atal Pension Yojana rules',
            'Punjab Ashirwad Shagun Scheme'
          ].map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(promptText)}
              style={{
                background: 'var(--color-ivory-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                color: 'var(--color-forest-dark)',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              + {promptText}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: 'var(--color-ivory-surface)',
          padding: '0.5rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-strong)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <textarea
            className="form-control"
            rows={1}
            placeholder={t('assistant.inputPlaceholder')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              border: 'none',
              resize: 'none',
              minHeight: '40px',
              maxHeight: '120px',
              padding: '0.5rem'
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputText.trim()}
            className="btn btn-primary"
            style={{ height: '40px', padding: '0 1.25rem' }}
          >
            <Send size={16} />
            <span>{t('assistant.send')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
