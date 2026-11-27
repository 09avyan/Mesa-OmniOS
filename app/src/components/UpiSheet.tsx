import { Icon } from './Icon'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Sheet, Tap } from './ui'
import { useT, rupees } from '../lib/i18n'

/** The QR itself: big, white, amount already inside. Customers scan with any UPI app. */
export function UpiQr({ upi, name, amount }: { upi: string; name: string; amount: number }) {
  const [img, setImg] = useState('')
  useEffect(() => {
    const uri = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill ' + name)}`
    QRCode.toDataURL(uri, { width: 640, margin: 1 }).then(setImg)
  }, [upi, name, amount])
  return <div className="vqr">{img && <img src={img} alt="UPI QR" />}</div>
}

// UPI payment QR with the amount already filled in. Customer scans with any UPI app (PhonePe, GPay, Paytm).
export function UpiSheet({ open, upi, name, amount, onClose }: { open: boolean; upi: string | null; name: string; amount: number; onClose: () => void }) {
  const { t } = useT()
  const [img, setImg] = useState('')
  useEffect(() => {
    if (!open || !upi) return
    const uri = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill ' + name)}`
    QRCode.toDataURL(uri, { width: 520, margin: 1 }).then(setImg)
  }, [open, upi, name, amount])
  return (
    <Sheet open={open} onClose={onClose}>
      {!upi ? <><h2 className="h2">{t('upiMissing')}</h2><p className="lab">{t('upiMissingBody')}</p><div className="gap16" /><Tap className="btn primary" onClick={onClose}>{t('ok')}</Tap></> : <>
        <div className="center">
          <div className="lab">{t('upiScan')}</div>
          <div className="big">{rupees(amount)}</div>
          {img && <img src={img} alt="UPI QR" style={{ width: '100%', maxWidth: 260, margin: '12px auto', display: 'block' }} />}
          <div className="lab" style={{ fontSize: 17 }}>{upi}</div>
        </div>
        <div className="gap16" />
        <Tap className="btn primary" onClick={onClose}><Icon name="tick" size={22} stroke={3} />{t('upiDone')}</Tap>
        <div className="gap8" />
        <Tap className="btn quiet" onClick={onClose}>{t('upiClose')}</Tap>
      </>}
    </Sheet>
  )
}
