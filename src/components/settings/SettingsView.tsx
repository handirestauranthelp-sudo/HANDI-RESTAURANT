import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantSettings, DatabaseState } from '../../types/restaurant';
import { 
  Settings, 
  Store, 
  FileText, 
  Printer, 
  Database, 
  Download, 
  Upload, 
  CheckCircle, 
  HelpCircle,
  ShieldCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export function SettingsView() {
  const { state, updateSettings, restoreDatabase, syncPdfMenu, currentStaff, language } = useRestaurant();

  const [formData, setFormData] = useState<RestaurantSettings>(state.settings);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = currentStaff.role === 'admin';

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert(language === 'hi' ? 'केवल Admin सेटिंग्स बदल सकते हैं।' : 'Only Admin can update settings.');
      return;
    }
    setIsSaving(true);
    await updateSettings(formData);
    setIsSaving(false);
    setStatusMsg(language === 'hi' ? 'सेटिंग्स सफलतापूर्वक सहेजी गईं!' : 'Settings updated successfully!');
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Download complete DB backup
  const handleDownloadBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `handi_restaurant_complete_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Upload and Restore DB
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed: DatabaseState = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.menu) && parsed.settings) {
          const confirm = window.confirm(
            language === 'hi' 
              ? 'क्या आप इस बैकअप फ़ाइल से पूरे डेटाबेस को रीस्टोर करना चाहते हैं? वर्तमान डेटा बदल जाएगा।'
              : 'Restore complete database from this backup file?'
          );
          if (confirm) {
            await restoreDatabase(parsed);
            setStatusMsg('Database restored successfully from file!');
          }
        } else {
          alert('Invalid backup file structure.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Configuration & Backup
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">Owner Level</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            {language === 'hi' ? 'रेस्टोरेंट सेटिंग्स व डेटा बैकअप' : 'Settings, Bill Customization & Data Backup'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi'
              ? 'रेस्टोरेंट का नाम, फोन, जीएसटी, प्रिंटर फॉर्मेट एवं बैकअप सेटिंग्स।'
              : 'Configure restaurant address, GSTIN, thermal printer format and cloud backups.'}
          </p>
        </div>

        <button
          onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 text-xs font-bold self-start md:self-auto"
        >
          <HelpCircle className="w-4 h-4" />
          <span>{language === 'hi' ? 'Firebase सेटअप गाइड (हिन्दी)' : 'Firebase Guide'}</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Step-by-Step Hindi Firebase & Online Sync Guide */}
      {showFirebaseGuide && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-850 to-slate-900 border border-amber-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>सरल हिन्दी में Firebase और रियल-टाइम ऑनलाइन सिंक गाइड</span>
            </h3>
            <button onClick={() => setShowFirebaseGuide(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              <strong>1. वर्तमान स्थिति:</strong> आपका ऐप अभी फुल-स्टैक एक्सप्रेस सर्वर और रियल-टाइम <strong>Server-Sent Events (SSE)</strong> के साथ पूरी तरह ऑनलाइन काम कर रहा है। जब भी रिसेप्शन, किचन या वेटर कोई भी ऑर्डर डालते हैं, वह तुरंत सभी डिवाइसों (फ़ोन, टैबलेट, कंप्यूटर) पर लाइव सिंक होता है और डिस्क पर स्थायी रूप से सेव रहता है।
            </p>

            <p>
              <strong>2. यदि आप Google Cloud Firebase का उपयोग करना चाहते हैं:</strong>
            </p>
            <ul className="list-decimal pl-5 space-y-1.5 text-slate-400">
              <li><a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">console.firebase.google.com</a> पर जाएँ और अपने Google खाते से लॉगिन करें।</li>
              <li><strong>Add Project</strong> पर क्लिक करें और नाम रखें: <code className="text-white">handi-restaurant-pos</code>।</li>
              <li>प्रोजेक्ट बनने के बाद <strong>Firestore Database</strong> पर क्लिक करके <strong>Create Database</strong> चुनें और <strong>Start in production mode</strong> चुनें।</li>
              <li><strong>Project Settings (गियर आइकन)</strong> में जाएँ और <strong>Your apps</strong> के अंदर <strong>Web (&lt;/&gt;)</strong> पर क्लिक करें।</li>
              <li>वहाँ मिलने वाले कॉन्फ़िग (apiKey, projectId, appId आदि) को अपने <code className="text-white">.env</code> फ़ाइल में जोड़ें।</li>
            </ul>

            <p className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              💡 <strong>सुझाव:</strong> किसी भी बाहरी सेटअप के बिना भी, यह ऐप AI Studio के सुरक्षित क्लाउड पर 24x7 चल रहा है और नीचे दिए गए "बैकअप डाउनलोड" बटन से आप कभी भी अपने सभी 75 व्यंजनों और सभी बिलों का 1-क्लिक बैकअप ले सकते हैं!
            </p>
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Restaurant Profile */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Store className="w-4 h-4 text-amber-500" />
            <span>Restaurant Profile & Contact Info</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Restaurant Name (English)</label>
              <input
                type="text"
                required
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Restaurant Name (Hindi / स्थानीय)</label>
              <input
                type="text"
                value={formData.restaurantHindiName}
                onChange={(e) => setFormData({ ...formData, restaurantHindiName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Restaurant Address (Printed on Bills)</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">WhatsApp Number (for sending bills)</label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">City</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Jaipur"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">State & Pincode</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Rajasthan"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
                <input
                  type="text"
                  value={formData.pincode || ''}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="302001"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">FSSAI License Number (Printed on Bills)</label>
              <input
                type="text"
                value={formData.fssaiNumber || ''}
                onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value })}
                placeholder="e.g. 12224026000123"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Dynamic UPI Payment & Live QR Settings */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">₹</span>
            <span>{language === 'hi' ? 'लाइव UPI QR कोड व डिजिटल पेमेंट सेटिंग्स' : 'Dynamic UPI QR & Counter Payment'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-slate-300 font-bold mb-1">
                {language === 'hi' ? 'डिफ़ॉल्ट UPI ID (VPA):' : 'Default UPI ID (VPA):'}
              </label>
              <input
                type="text"
                required
                value={formData.upiId || ''}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="e.g. handirestaurant@upi or 9876543210@paytm"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'hi' 
                  ? 'यह UPI ID बिल के QR कोड पर सक्रिय रहेगी। ग्राहक द्वारा स्कैन करने पर PhonePe, Google Pay, Paytm में बिल्कुल सटीक बिल राशि अपने-आप लॉक होकर खुलेगी।' 
                  : 'NPCI compliant UPI URI. Generates dynamic QR codes locked to the exact bill amount for PhonePe, GPay, Paytm.'}
              </p>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                {language === 'hi' ? 'डिफ़ॉल्ट सर्विस चार्ज (%)' : 'Default Service Charge (%)'}
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={formData.defaultServiceChargePercent || 0}
                onChange={(e) => setFormData({ ...formData, defaultServiceChargePercent: Number(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Optional: Auto-calculate service charge on settlement (can be adjusted during billing)
              </p>
            </div>
          </div>
        </div>

        {/* GST & Taxation */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>GST & Taxation Settings</span>
            </h3>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.gstEnabled}
                onChange={(e) => setFormData({ ...formData, gstEnabled: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500"
              />
              <span className="text-xs font-bold text-white">Enable GST on Food Bills</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">GSTIN (GST Identification Number)</label>
              <input
                type="text"
                disabled={!formData.gstEnabled}
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                placeholder="e.g. 08AAAAA0000A1Z5"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">GST Percentage (%)</label>
              <input
                type="number"
                disabled={!formData.gstEnabled}
                value={formData.gstPercent}
                onChange={(e) => setFormData({ ...formData, gstPercent: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Printer & Bill Appearance */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Printer className="w-4 h-4 text-amber-500" />
            <span>Thermal Printer & Bill Formatting</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Thermal Paper Roll Width</label>
              <select
                value={formData.thermalPaperWidth}
                onChange={(e) => setFormData({ ...formData, thermalPaperWidth: e.target.value as '80mm' | '58mm' })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold"
              >
                <option value="80mm">80mm Standard POS Printer (Recommended)</option>
                <option value="58mm">58mm Mini Thermal Printer</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Bill Footer Message</label>
              <input
                type="text"
                value={formData.billFooter}
                onChange={(e) => setFormData({ ...formData, billFooter: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            {isSaving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>

      {/* Backup and Safety Module */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Data Safety & One-Click Backup</span>
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed">
          {language === 'hi'
            ? 'आपका पूरा डेटा (75 मेन्यू आइटम, 15 कमरों के हिसाब, सभी पुराने बिल व भुगतान) सर्वर पर सुरक्षित है। आप कभी भी पूरी डेटाबेस फ़ाइल डाउनलोड या रीस्टोर कर सकते हैं।'
            : 'Your entire database (75 menu items, 15 room accounts, historical bills and payments) is permanently backed up. Download or restore anytime.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Full JSON Backup</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Restore From Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
