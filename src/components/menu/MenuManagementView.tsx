import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem } from '../../types/restaurant';
import { formatCurrency } from '../../utils/formatters';
import { parseMenuCsv, generateSampleCsvTemplate } from '../../utils/csvParser';
import { 
  Utensils, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Download, 
  Upload, 
  Sparkles,
  Layers,
  Check,
  AlertCircle,
  FileSpreadsheet,
  FileUp,
  X
} from 'lucide-react';

export function MenuManagementView() {
  const { 
    state, 
    updateMenuItem, 
    addMenuItem, 
    deleteMenuItem, 
    importCsvMenu,
    syncPdfMenu, 
    currentStaff, 
    language 
  } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // CSV Import State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvParsedItems, setCsvParsedItems] = useState<MenuItem[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  // New item form state
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    hindiName: '',
    category: 'Handi Specials',
    isVeg: false,
    price: 250,
    hasVariants: false,
    isAvailable: true,
    description: '',
    sku: ''
  });

  const isAdmin = currentStaff.role === 'admin';

  // Filtered list
  const filteredMenu = useMemo(() => {
    return state.menu.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        (item.hindiName && item.hindiName.includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q));

      const matchesCat = selectedCategory === 'All Items' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [state.menu, searchQuery, selectedCategory]);

  // Handle Sync with PDF
  const handleSyncOfficialPdf = async () => {
    const confirm = window.confirm(
      language === 'hi' 
        ? 'क्या आप आधिकारिक Handi Restaurant PDF से पूरे 75 व्यंजन और प्रामाणिक कीमतें डेटाबेस में सिंक/रीलोड करना चाहते हैं?'
        : 'Run automated ingestion script to sync all 75 authentic dishes and prices from Handi Restaurant PDF?'
    );
    if (!confirm) return;

    setIsSyncing(true);
    const res = await syncPdfMenu();
    setIsSyncing(false);

    if (res.success) {
      setSyncStatusMsg(`Successfully ingested and synced ${res.count || 75} authentic items from full_xl_menu_055393af.pdf!`);
      setTimeout(() => setSyncStatusMsg(null), 6000);
    }
  };

  // Toggle availability
  const handleToggleAvailability = async (item: MenuItem) => {
    if (!isAdmin) {
      alert(language === 'hi' ? 'केवल व्यवस्थापक (Admin) मेन्यू बदल सकते हैं।' : 'Only Admin can update menu.');
      return;
    }
    await updateMenuItem(item.id, { isAvailable: !item.isAvailable });
  };

  // Save Edit Item
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    await updateMenuItem(editingItem.id, editingItem);
    setEditingItem(null);
  };

  // Save New Item
  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: formData.name,
      hindiName: formData.hindiName,
      category: formData.category || 'Handi Specials',
      isVeg: Boolean(formData.isVeg),
      price: Number(formData.price) || 0,
      hasVariants: Boolean(formData.hasVariants),
      variants: formData.hasVariants ? [
        { name: 'Quarter', price: Math.round(Number(formData.price) * 0.4) },
        { name: 'Half', price: Math.round(Number(formData.price) * 0.65) },
        { name: 'Full', price: Number(formData.price) }
      ] : undefined,
      description: formData.description || '',
      isAvailable: true,
      sku: formData.sku || `ITEM-${Math.floor(Math.random() * 900 + 100)}`
    };

    await addMenuItem(newItem);
    setIsAddingNew(false);
    setFormData({
      name: '',
      hindiName: '',
      category: 'Handi Specials',
      isVeg: false,
      price: 250,
      hasVariants: false,
      isAvailable: true,
      description: '',
      sku: ''
    });
  };

  // Export Menu to CSV
  const handleExportCSV = () => {
    const headers = ['SKU', 'Item Name', 'Hindi Name', 'Category', 'Veg/NonVeg', 'Price', 'Available'];
    const rows = state.menu.map(m => [
      m.sku || '',
      `"${m.name.replace(/"/g, '""')}"`,
      `"${(m.hindiName || '').replace(/"/g, '""')}"`,
      `"${m.category}"`,
      m.isVeg ? 'Veg' : 'Non-Veg',
      m.price,
      m.isAvailable ? 'Yes' : 'No'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `handi_restaurant_menu_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(generateSampleCsvTemplate());
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `handi_menu_template_sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV file selection & parsing
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { items, errors } = parseMenuCsv(text);
      setCsvParsedItems(items);
      setCsvErrors(errors);
    };
    reader.readAsText(file);
  };

  // Confirm CSV Import
  const handleConfirmCsvImport = async () => {
    if (csvParsedItems.length === 0) return;
    setIsImportingCsv(true);
    const res = await importCsvMenu(csvParsedItems, importMode);
    setIsImportingCsv(false);

    if (res.success) {
      setSyncStatusMsg(`Successfully imported ${res.count} food items from CSV (${importMode === 'replace' ? 'replaced existing menu' : 'appended/updated database'})!`);
      setShowCsvModal(false);
      setCsvParsedItems([]);
      setCsvFileName('');
      setTimeout(() => setSyncStatusMsg(null), 6000);
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Banner with Ingestion Script Trigger */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              PDF Menu Database
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">{state.menu.length} Dishes Ingested</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
            <Utensils className="w-5 h-5 text-amber-500" />
            {language === 'hi' ? 'मेन्यू प्रबंधन (Menu & Price Engine)' : 'Menu & Price Management'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi'
              ? 'पीडीएफ से 75 प्रामाणिक व्यंजन। नया CSV अपलोड करें या स्वचालित इंजेक्शन से सिंक करें।'
              : '75 authentic items from PDF. Upload CSV spreadsheet to update or sync official PDF menu.'}
          </p>
        </div>

        {/* Action Buttons: Add Item & Ingest PDF Script */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* CSV Import Button */}
          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            title="Import Menu from CSV file"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{language === 'hi' ? 'CSV मेन्यू इम्पोर्ट' : 'Import Menu CSV'}</span>
          </button>

          {/* Automated Database Ingestion Script */}
          <button
            onClick={handleSyncOfficialPdf}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
            title="Execute automated ingestion script to sync database with full_xl_menu_055393af.pdf"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Ingesting PDF...' : (language === 'hi' ? 'PDF से री-सिंक' : 'Sync PDF Menu')}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV Export</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{language === 'hi' ? 'नया व्यंजन जोड़ें' : 'Add Food Item'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Alert */}
      {syncStatusMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{syncStatusMsg}</span>
          </div>
          <button onClick={() => setSyncStatusMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by dish name, Hindi name, or SKU code..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {state.categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-750'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Table */}
      <div className="rounded-2xl bg-slate-850 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Diet</th>
                <th className="py-3 px-4">Selling Price / Variants</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMenu.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-sm">{item.name}</div>
                    {item.hindiName && <div className="text-[11px] text-slate-400">{item.hindiName}</div>}
                    {item.sku && <div className="text-[10px] text-slate-500 font-mono">SKU: {item.sku}</div>}
                  </td>

                  <td className="py-3 px-4 text-slate-300 font-medium">
                    {item.category}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      item.isVeg 
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' 
                        : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span>{item.isVeg ? 'VEG' : 'NON-VEG'}</span>
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {item.hasVariants ? (
                      <div className="space-y-0.5">
                        <div className="flex gap-2">
                          {item.variants?.map(v => (
                            <span key={v.name} className="text-[11px] font-mono text-slate-300">
                              <span className="text-slate-500">{v.name[0]}:</span> ₹{v.price}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="font-black text-amber-400 text-sm tabular-nums">
                        {formatCurrency(item.price)}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                        item.isAvailable 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Disabled'}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700"
                        title="Edit Item Price & Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete ${item.name} from menu?`)) {
                              await deleteMenuItem(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-750"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-750 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" />
                <span>Edit {editingItem.name}</span>
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Item Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Hindi Name</label>
                <input
                  type="text"
                  value={editingItem.hindiName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, hindiName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Standard / Base Price (₹)</label>
                <input
                  type="number"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              {editingItem.hasVariants && editingItem.variants && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="font-bold text-amber-400">Variant Prices (Quarter / Half / Full):</span>
                  <div className="grid grid-cols-3 gap-2">
                    {editingItem.variants.map((v, idx) => (
                      <div key={v.name}>
                        <label className="block text-[10px] text-slate-400">{v.name}</label>
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => {
                            const newVariants = [...(editingItem.variants || [])];
                            newVariants[idx] = { ...v, price: Number(e.target.value) || 0 };
                            setEditingItem({ ...editingItem, variants: newVariants });
                          }}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-750 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Add New Food Item</span>
              </h3>
              <button onClick={() => setIsAddingNew(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveNew} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Handi Mutton Keema"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Hindi Name</label>
                <input
                  type="text"
                  value={formData.hindiName}
                  onChange={(e) => setFormData({ ...formData, hindiName: e.target.value })}
                  placeholder="e.g. हांडी मटन कीमा"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    {state.categories.filter(c => c !== 'All Items').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-slate-300">Vegetarian Dish</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasVariants}
                    onChange={(e) => setFormData({ ...formData, hasVariants: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-slate-300">Enable Q/H/F Variants</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description of recipe / ingredients..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Add to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-750 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  {language === 'hi' ? 'CSV से मेन्यू इम्पोर्ट करें' : 'Import Menu from CSV File'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowCsvModal(false);
                  setCsvParsedItems([]);
                  setCsvErrors([]);
                  setCsvFileName('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs text-slate-300">
              {/* Instructions and Download Template */}
              <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">
                    {language === 'hi' ? 'एक्सेल (Excel) या CSV प्रारूप में व्यंजन अपलोड करें' : 'Upload dish list formatted in Excel or CSV'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Required columns: <code className="text-amber-400">Item Name</code>, <code className="text-amber-400">Price</code>. Optional: Category, Hindi Name, Veg/NonVeg, Quarter, Half, Full.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 font-bold whitespace-nowrap flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-850/50 hover:bg-slate-850">
                <FileUp className="w-8 h-8 text-blue-400 mb-2" />
                <span className="font-bold text-white text-sm">
                  {csvFileName ? `Selected: ${csvFileName}` : (language === 'hi' ? 'CSV फ़ाइल यहाँ चुनें या ड्रॉप करें' : 'Click to Browse or Drag CSV File Here')}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">Accepts standard .csv format</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
              </label>

              {/* CSV Errors */}
              {csvErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>CSV Format Issues:</span>
                  </div>
                  {csvErrors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}

              {/* Preview of Parsed Items */}
              {csvParsedItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Parsed {csvParsedItems.length} Dishes Ready to Import:</span>
                    </span>

                    {/* Mode selector */}
                    <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-750">
                      <button
                        type="button"
                        onClick={() => setImportMode('append')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                          importMode === 'append' ? 'bg-blue-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        Append & Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('replace')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                          importMode === 'replace' ? 'bg-rose-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        Replace Menu
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 text-[10px] uppercase">
                          <th className="py-2 px-3">Item Name</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Diet</th>
                          <th className="py-2 px-3">Price / Variants</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {csvParsedItems.slice(0, 50).map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3 font-medium text-white">
                              {it.name} {it.hindiName ? `(${it.hindiName})` : ''}
                            </td>
                            <td className="py-2 px-3 text-slate-400">{it.category}</td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                it.isVeg ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                              }`}>
                                {it.isVeg ? 'VEG' : 'NON-VEG'}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-amber-400">
                              {it.hasVariants 
                                ? `Q: ₹${it.variants?.[0]?.price} | H: ₹${it.variants?.[1]?.price} | F: ₹${it.variants?.[2]?.price}` 
                                : `₹${it.price}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvParsedItems.length > 50 && (
                    <p className="text-[10px] text-slate-500 text-center">... and {csvParsedItems.length - 50} more items</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                {csvParsedItems.length > 0 ? `${csvParsedItems.length} items parsed` : 'No file loaded yet'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCsvModal(false);
                    setCsvParsedItems([]);
                    setCsvFileName('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCsvImport}
                  disabled={csvParsedItems.length === 0 || isImportingCsv}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    csvParsedItems.length > 0 && !isImportingCsv
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {isImportingCsv ? 'Importing...' : `Import ${csvParsedItems.length} Items Now`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
