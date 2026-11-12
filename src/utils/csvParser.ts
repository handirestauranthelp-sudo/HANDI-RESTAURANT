import { MenuItem } from '../types/restaurant';

export function parseMenuCsv(csvText: string): { items: MenuItem[]; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  const items: MenuItem[] = [];
  const errors: string[] = [];

  if (lines.length < 2) {
    return { items, errors: ['CSV file is empty or missing data rows.'] };
  }

  // Parse header line
  const headerLine = lines[0];
  const headers = splitCsvRow(headerLine).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Find column indexes
  const nameIdx = headers.findIndex(h => h.includes('name') || h === 'item' || h === 'itemname');
  const hindiIdx = headers.findIndex(h => h.includes('hindi') || h === 'hindiname');
  const catIdx = headers.findIndex(h => h.includes('category') || h === 'group');
  const priceIdx = headers.findIndex(h => h === 'price' || h === 'rate' || h === 'cost' || h === 'sellingprice');
  const vegIdx = headers.findIndex(h => h.includes('veg') || h === 'diet' || h === 'type');
  const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('detail'));
  const skuIdx = headers.findIndex(h => h === 'sku' || h === 'code');
  const quarterIdx = headers.findIndex(h => h.includes('quarter') || h === 'qtr');
  const halfIdx = headers.findIndex(h => h.includes('half'));
  const fullIdx = headers.findIndex(h => h.includes('full'));

  if (nameIdx === -1 || (priceIdx === -1 && fullIdx === -1)) {
    return {
      items,
      errors: ['CSV must have at least "Item Name" and "Price" (or "Full") columns.']
    };
  }

  // Process rows
  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvRow(lines[i]);
    if (row.length < 2) continue;

    const name = row[nameIdx]?.trim();
    if (!name) continue;

    const hindiName = hindiIdx > -1 ? row[hindiIdx]?.trim() : undefined;
    const category = catIdx > -1 && row[catIdx]?.trim() ? row[catIdx].trim() : 'Handi Specials';
    
    // Veg/Non-Veg detection
    const vegRaw = vegIdx > -1 ? row[vegIdx]?.trim().toLowerCase() : '';
    const isVeg = vegRaw === 'veg' || vegRaw === 'vegetarian' || vegRaw === 'true' || vegRaw === '1' || vegRaw === 'yes';

    // Pricing & Variants
    const singlePrice = priceIdx > -1 ? parseFloat(row[priceIdx]?.replace(/[^0-9.]/g, '') || '0') : 0;
    const quarterPrice = quarterIdx > -1 ? parseFloat(row[quarterIdx]?.replace(/[^0-9.]/g, '') || '0') : 0;
    const halfPrice = halfIdx > -1 ? parseFloat(row[halfIdx]?.replace(/[^0-9.]/g, '') || '0') : 0;
    const fullPrice = fullIdx > -1 ? parseFloat(row[fullIdx]?.replace(/[^0-9.]/g, '') || '0') : 0;

    const hasVariants = quarterPrice > 0 || halfPrice > 0 || fullPrice > 0;
    const finalPrice = singlePrice > 0 ? singlePrice : (fullPrice > 0 ? fullPrice : 100);

    const variants = hasVariants ? [
      { name: 'Quarter' as const, price: quarterPrice > 0 ? quarterPrice : Math.round(finalPrice * 0.4) },
      { name: 'Half' as const, price: halfPrice > 0 ? halfPrice : Math.round(finalPrice * 0.65) },
      { name: 'Full' as const, price: fullPrice > 0 ? fullPrice : finalPrice }
    ] : undefined;

    const description = descIdx > -1 ? row[descIdx]?.trim() : undefined;
    const sku = skuIdx > -1 && row[skuIdx]?.trim() ? row[skuIdx].trim() : `ITEM-${Math.floor(Math.random() * 9000 + 1000)}`;

    items.push({
      id: `item-${Date.now()}-${i}`,
      name,
      hindiName,
      category,
      isVeg,
      hasVariants,
      variants,
      price: finalPrice,
      description,
      isAvailable: true,
      sku
    });
  }

  return { items, errors };
}

function splitCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function generateSampleCsvTemplate(): string {
  const sampleRows = [
    ['Item Name', 'Hindi Name', 'Category', 'Price', 'Veg/NonVeg', 'Description', 'SKU', 'Quarter', 'Half', 'Full'],
    ['Handi Special Murgh', 'हांडी स्पेशल मुर्ग', 'Handi Specials', '320', 'Non-Veg', 'House specialty slow cooked chicken', 'HND-10', '320', '480', '850'],
    ['Paneer Lababdar', 'पनीर लबाबदार', 'Veg Main Course & Kofta', '280', 'Veg', 'Rich tomato and melon seed gravy with paneer cubes', 'VEG-15', '0', '0', '280'],
    ['Tandoori Roti Plain', 'तंदूरी रोटी सादा', 'Roti & Naan', '25', 'Veg', 'Clay oven fresh whole wheat roti', 'ROT-20', '0', '0', '25'],
    ['Chicken Dum Biryani', 'चिकन दम बिरयानी', 'Biryani & Rice', '260', 'Non-Veg', 'Dum cooked basmati rice with chicken', 'BRY-25', '0', '0', '260'],
    ['Gulab Jamun (2 Pcs)', 'गुलाब जामुन (2 पीस)', 'Desserts', '60', 'Veg', 'Soft milk dumplings soaked in saffron syrup', 'DES-10', '0', '0', '60']
  ];

  return sampleRows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}
