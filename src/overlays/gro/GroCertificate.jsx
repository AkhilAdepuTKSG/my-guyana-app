import PageOverlay from '../../components/ui/PageOverlay';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { useApi, useAction, useUserId } from '../../hooks/useApi';
import { collectCertificate, certificateTypeLabel } from '../../api/gro';
import { InfoPanel, LoadingState, ErrorState } from '../../components/service/ServicePieces';
import { CERTIFICATE_TITLES, renderCertificatePdf, certificateFileName } from '../../lib/certificates';
import { formatLongDate, downloadBlob } from '../../lib/format';

// The certificate itself.
//
// Opening this collects the certificate: it is generated from the register
// entry on first collection, shown here, and filed in the citizen's own Vault.
// The PDF is drawn from exactly the rows shown on screen, so the download is
// the same document.

const ACCENT = '#7d3550';
const NAVY = 'var(--brand-600)';

export default function GroCertificate() {
  const { isOpen, getPayload, closeOverlay, navigate, showToast, user } = useAppState();
  const open = isOpen('groCertificate');
  const payload = getPayload('groCertificate');
  const requestId = payload && typeof payload === 'object' ? payload.requestId : null;
  const userId = useUserId();

  // Collecting is the read: it issues the certificate if one has not been
  // issued yet, and files it in the Vault. Running it again is harmless.
  const view = useApi(
    () => collectCertificate({ userId, requestId, issuedTo: user?.name || null }),
    [userId, requestId],
    { enabled: open && !!userId && !!requestId }
  );

  const download = useAction(async () => {
    const blob = renderCertificatePdf({
      certificate: view.data.certificate,
      registration: view.data.registration,
      issuedTo: user?.name || null,
    });
    downloadBlob(blob, certificateFileName(view.data.certificate));
    return true;
  });

  if (!open) return null;

  const certificate = view.data?.certificate;
  const registration = view.data?.registration;
  const rows = certificate?.payload || [];

  const footer = certificate && (
    <div style={{
      padding: '12px 20px calc(16px + env(safe-area-inset-bottom, 0px))',
      background: 'var(--surface-1)', borderTop: '1px solid var(--surface-hairline)',
      display: 'flex', flexDirection: 'column', gap: 9,
    }}>
      <Button
        fullWidth
        style={{ background: ACCENT }}
        icon={<Icon name="download" size={17} color="#fff" />}
        onClick={async () => {
          await download.run();
          showToast('Certificate downloaded');
        }}
        disabled={download.pending}
      >
        Download PDF
      </Button>
      <Button
        fullWidth
        variant="outline"
        icon={<Icon name="folder-lock" size={17} color="var(--fg-3)" />}
        onClick={() => { closeOverlay('groCertificate'); navigate('vault'); }}
      >
        Open my Vault
      </Button>
    </div>
  );

  return (
    <PageOverlay
      open={open}
      onClose={() => closeOverlay('groCertificate')}
      title={certificate ? `${certificateTypeLabel(certificate.type)} certificate` : 'Certificate'}
      subtitle="General Register Office"
      footer={footer}
    >
      {view.loading ? (
        <LoadingState label="Preparing your certificate…" />
      ) : view.error ? (
        <ErrorState error={view.error} onRetry={view.reload} title="This certificate is not available yet" />
      ) : !certificate ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoPanel
            tone="success"
            icon="folder-lock"
            title={view.data.filedNow ? 'Filed in your Vault' : 'This is in your Vault'}
          >
            Your certified copy is stored under your account. Only you can see it — it does not appear for anyone else who uses this device.
          </InfoPanel>

          {/* --- The certificate, drawn the same way as the PDF ------------- */}
          <div style={{
            borderRadius: 'var(--radius-xl)', overflow: 'hidden',
            border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            {/* Masthead */}
            <div style={{
              background: 'var(--hero-navy-gradient, linear-gradient(160deg, #142b44 0%, #0e2237 100%))',
              color: '#fff', padding: '22px 20px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: '0.16em' }}>REPUBLIC OF GUYANA</div>
              <div style={{ marginTop: 5, fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', color: 'rgba(255,255,255,0.72)' }}>
                GENERAL REGISTER OFFICE
              </div>
              <div style={{ marginTop: 3, fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>Ministry of Legal Affairs</div>
            </div>

            <div style={{ padding: '20px 18px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>
                  {CERTIFICATE_TITLES[certificate.type]}
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--fg-3)' }}>
                  Issued under the Registration of Births and Deaths Act, Chapter 44:01
                </p>
              </div>

              {/* Reference strip */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                padding: '12px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--surface-2)', border: '1px solid var(--surface-border)',
              }}>
                <RefCell label="Certificate number" value={certificate.certNo} />
                <RefCell label="Registration number" value={certificate.regNo} />
                <RefCell label="Date issued" value={formatLongDate(certificate.issuedAt)} />
                <RefCell label="District registry" value={registration?.registryDistrict || '—'} />
              </div>

              {/* Register entry */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.11em', color: 'var(--fg-3)' }}>
                  PARTICULARS ENTERED IN THE REGISTER
                </span>
                <div style={{ height: 2, background: NAVY, borderRadius: 999, marginTop: 5, marginBottom: 4 }} />
                {rows.map((row, i) => (
                  <div
                    key={`${row.label}-${i}`}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
                      borderBottom: i < rows.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                    }}
                  >
                    <span style={{ flex: '0 0 44%', fontSize: 11.5, lineHeight: 1.4, color: 'var(--fg-3)' }}>{row.label}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.4, fontWeight: 700, color: 'var(--fg-1)', wordBreak: 'break-word' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Certification */}
              <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.55, color: 'var(--fg-3)' }}>
                I certify that the above is a true copy of an entry in the register kept at the General Register Office,
                Georgetown, Guyana. This certificate is issued electronically through My Guyana and is valid without a
                manuscript signature.
              </p>

              <div style={{ display: 'flex', gap: 16 }}>
                <SignatureLine label="Registrar General" />
                <SignatureLine label="Official seal — GRO" />
              </div>

              <div style={{ paddingTop: 12, borderTop: '1px solid var(--surface-hairline)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--fg-4)' }}>
                  {user?.name ? `Issued to ${user.name} via My Guyana` : 'Issued via My Guyana'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--fg-4)' }}>
                  Verify at gro.gov.gy using {certificate.certNo}
                </span>
                <span style={{ fontSize: 9.5, lineHeight: 1.4, color: 'var(--fg-4)' }}>
                  WARNING: it is an offence to alter this certificate or to use an altered certificate.
                </span>
              </div>
            </div>
          </div>

          <InfoPanel tone="neutral" icon="info">
            The PDF you download is the same document shown here. Banks, schools, employers and the courts accept it.
          </InfoPanel>

          <div style={{ height: 4 }} />
        </div>
      )}
    </PageOverlay>
  );
}

function RefCell({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 700, color: 'var(--fg-1)', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

function SignatureLine({ label }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ height: 1, background: 'var(--fg-1)', marginTop: 18 }} />
      <span style={{ fontSize: 10, color: 'var(--fg-3)' }}>{label}</span>
    </div>
  );
}
