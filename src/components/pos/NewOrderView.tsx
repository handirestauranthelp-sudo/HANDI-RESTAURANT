import { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { FIXED_ROOMS } from '../../data/initialMenu';
import { MenuItem, OrderItem, OrderType, ExtraCharge } from '../../types/restaurant';
import { formatCurrency } from '../../utils/formatters';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ChefHat, 
  Sparkles, 
  CheckCircle,
  DoorClosed,
  ShoppingBag,
  Truck,
  Store,
  Layers,
  FileText,
  User,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function NewOrderView() {
  const { state, createOrder, setActiveTab, setSelectedRoom, currentStaff, language } = useRestaurant();

  const [orderType, setOrderType] = useState<OrderType>('room');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('101');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerCountry, setCustomerCountry] = useState('India');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('Discount');
  
  // Extra charges (Service charge, packaging, etc.)
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [chargeNameInput, setChargeNameInput] = useState('Service Charge');
  const [chargeAmtInput, setChargeAmtInput] = useState('');
  const [showAddChargeInput, setShowAddChargeInput] = useState(false);
  const [showGuestDetails, setShowGuestDetails] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'nonveg'>('all');

  // Cart
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  // Variant selector modal
  const [variantModalItem, setVariantModalItem] = useState<MenuItem | null>(null);

  // Filtered menu
  const filteredMenu = useMemo(() => {
    return state.menu.filter(item => {
      // availability
      if (!item.isAvailable) return false;

      // search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        (item.hindiName && item.hindiName.includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q));

      // category
      const matchesCategory = selectedCategory === 'All Items' || item.category === selectedCategory;

      // veg filter
      const matchesVeg = 
        vegFilter === 'all' || 
        (vegFilter === 'veg' && item.isVeg) || 
        (vegFilter === 'nonveg' && !item.isVeg);

      return matchesSearch && matchesCategory && matchesVeg;
    });
  }, [state.menu, searchQuery, selectedCategory, vegFilter]);

  // Add item to cart
  const addItemToCart = (item: MenuItem, variantName?: 'Quarter' | 'Half' | 'Full' | 'Standard', price?: number) => {
    const finalVariant = variantName || (item.hasVariants ? item.variants?.[0]?.name || 'Full' : 'Standard');
    const finalRate = price !== undefined ? price : (
      item.hasVariants 
        ? (item.variants?.find(v => v.name === finalVariant)?.price || item.price)
        : item.price
    );

    const existingIndex = cartItems.findIndex(
      ci => ci.menuItemId === item.id && ci.variantName === finalVariant
    );

    if (existingIndex > -1) {
      setCartItems(prev => {
        const copy = [...prev];
        const existing = copy[existingIndex];
        const newQty = existing.quantity + 1;
        copy[existingIndex] = {
          ...existing,
          quantity: newQty,
          total: newQty * existing.rate
        };
        return copy;
      });
    } else {
      const newItem: OrderItem = {
        id: `cart-${Date.now()}-${Math.random()}`,
        menuItemId: item.id,
        name: item.name,
        variantName: finalVariant,
        rate: finalRate, // PRICE SNAPSHOT: permanently locked at moment of ordering
        quantity: 1,
        total: finalRate
      };
      setCartItems(prev => [...prev, newItem]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    setCartItems(prev => {
      const copy = [...prev];
      const item = copy[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index] = {
        ...item,
        quantity: newQty,
        total: newQty * item.rate
      };
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.total, 0);
  }, [cartItems]);

  const taxAmount = useMemo(() => {
    if (!state.settings.gstEnabled) return 0;
    return Math.round((subtotal * state.settings.gstPercent) / 100);
  }, [subtotal, state.settings.gstEnabled, state.settings.gstPercent]);

  const totalExtraCharges = useMemo(() => {
    return extraCharges.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [extraCharges]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + taxAmount + totalExtraCharges - discountAmount);
  }, [subtotal, taxAmount, totalExtraCharges, discountAmount]);

  const handleAddExtraCharge = () => {
    const amt = Number(chargeAmtInput);
    if (!chargeNameInput || isNaN(amt) || amt <= 0) return;
    setExtraCharges(prev => [...prev, { name: chargeNameInput.trim(), amount: amt }]);
    setChargeAmtInput('');
    setShowAddChargeInput(false);
  };

  const handleRemoveExtraCharge = (index: number) => {
    setExtraCharges(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Order
  const handleSaveOrder = async () => {
    if (cartItems.length === 0) return;
    setSubmitting(true);

    const result = await createOrder({
      type: orderType,
      roomNumber: orderType === 'room' ? selectedRoomNumber : undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerCity: customerCity.trim() || undefined,
      customerCountry: customerCountry.trim() || undefined,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      items: cartItems,
      subtotal,
      discount: discountAmount,
      discountReason: discountAmount > 0 ? discountReason : undefined,
      extraCharges,
      tax: taxAmount,
      grandTotal,
      notes: orderNotes
    });

    setSubmitting(false);

    if (result.success && result.order) {
      setOrderSuccessId(result.order.id);
      setCartItems([]);
      setOrderNotes('');
      setDiscountAmount(0);
      setExtraCharges([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerCity('');
      setDeliveryAddress('');
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Success banner if just ordered */}
      {orderSuccessId && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 shadow-xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{language === 'hi' ? 'ऑर्डर सफलतापूर्वक किचन भेजा गया!' : 'Order Sent to Kitchen Successfully!'}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                  {orderSuccessId}
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                {orderType === 'room' 
                  ? `Room ${selectedRoomNumber} food account updated with price snapshot.`
                  : 'Outside customer order added to active records.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {orderType === 'room' && (
              <button
                onClick={() => {
                  setSelectedRoom(selectedRoomNumber);
                  setActiveTab('room-accounts');
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
              >
                {language === 'hi' ? `रूम ${selectedRoomNumber} खाता देखें` : `View Room ${selectedRoomNumber}`}
              </button>
            )}
            <button
              onClick={() => setActiveTab('kitchen-display')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              {language === 'hi' ? 'किचन KDS देखें' : 'Kitchen KDS'}
            </button>
            <button
              onClick={() => setOrderSuccessId(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Header & Order Type Switcher */}
      <div className="p-4 md:p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-500" />
              {language === 'hi' ? 'नया फ़ूड ऑर्डर बनाएं (New POS Order)' : 'Create New Food Order'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'hi' 
                ? '15 कमरों के लिए या काउंटर/टेकअवे ग्राहकों के लिए खाना ऑर्डर करें' 
                : 'Take room food order or counter/delivery customer order'}
            </p>
          </div>

          {/* 4 Order Types */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-750 self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setOrderType('room')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                orderType === 'room'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DoorClosed className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'रूम ऑर्डर' : 'Room Order'}</span>
            </button>

            <button
              onClick={() => setOrderType('counter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                orderType === 'counter'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'काउंटर' : 'Counter'}</span>
            </button>

            <button
              onClick={() => setOrderType('takeaway')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                orderType === 'takeaway'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'टेकअवे/पार्सल' : 'Takeaway'}</span>
            </button>

            <button
              onClick={() => setOrderType('delivery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                orderType === 'delivery'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'होम डिलीवरी' : 'Delivery'}</span>
            </button>
          </div>
        </div>

        {/* Room Selection or Outside Customer Info */}
        {orderType === 'room' ? (
          <div className="pt-3 border-t border-slate-750">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <DoorClosed className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'hi' ? '15 में से कमरा नंबर चुनें:' : 'Select Room Number (15 Fixed Rooms):'}</span>
              </label>
              <span className="text-[11px] text-amber-400 font-semibold">
                Selected: Room {selectedRoomNumber}
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-15 gap-2">
              {FIXED_ROOMS.map(r => {
                const isSelected = selectedRoomNumber === r.roomNumber;
                return (
                  <button
                    key={r.roomNumber}
                    onClick={() => setSelectedRoomNumber(r.roomNumber)}
                    className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 shadow-md scale-105'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span className="text-[10px] block opacity-70 font-normal">Fl {r.floor}</span>
                    <span className="text-sm font-black">{r.roomNumber}</span>
                  </button>
                );
              })}
            </div>

            {/* Optional Guest Contact for Room Order */}
            <div className="mt-3 pt-2.5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowGuestDetails(!showGuestDetails)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                <span>{showGuestDetails ? '▲ Hide Optional Guest Contact' : '+ Add Optional Guest Contact Details (WhatsApp / City)'}</span>
              </button>

              {showGuestDetails && (
                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Guest Name (Optional)</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">WhatsApp Mobile (Optional)</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">City (Optional)</label>
                    <input
                      type="text"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      placeholder="e.g. Jaipur"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-750 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {language === 'hi' ? 'ग्राहक का नाम (वैकल्पिक)' : 'Customer Name (Optional)'}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {language === 'hi' ? 'WhatsApp मोबाइल नंबर (वैकल्पिक)' : 'WhatsApp Mobile (Optional)'}
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {language === 'hi' ? 'शहर (City)' : 'City (Optional)'}
              </label>
              <input
                type="text"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="e.g. Jaipur"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {language === 'hi' ? 'देश (Country)' : 'Country'}
              </label>
              <input
                type="text"
                value={customerCountry}
                onChange={(e) => setCustomerCountry(e.target.value)}
                placeholder="India"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {orderType === 'delivery' && (
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {language === 'hi' ? 'डिलीवरी का पता' : 'Delivery Address'}
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Flat / House / Street..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main 2-Column POS Layout: Left is Menu, Right is Cart Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Menu Items Search & Grid (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search & Filters */}
          <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'hi' ? 'व्यंजन खोजें (e.g. Handi Meat, Butter Chicken, Naan)...' : 'Search dishes (e.g. Handi Meat, Butter Chicken, Naan)...'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Veg / Non-Veg segmented buttons */}
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-750 shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setVegFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    vegFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({state.menu.length})
                </button>
                <button
                  onClick={() => setVegFilter('veg')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    vegFilter === 'veg' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Veg</span>
                </button>
                <button
                  onClick={() => setVegFilter('nonveg')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    vegFilter === 'nonveg' ? 'bg-rose-600 text-white font-bold' : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>Non-Veg</span>
                </button>
              </div>
            </div>

            {/* Category horizontal scrolling tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {state.categories.map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-750'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu Items Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredMenu.map(item => {
              const isHandiSpecial = item.category === 'Handi Specials';
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl bg-slate-850 border transition-all flex flex-col justify-between group hover:border-slate-650 ${
                    isHandiSpecial ? 'border-amber-500/40 bg-gradient-to-br from-slate-850 via-slate-850 to-amber-950/20' : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header: Name & Veg indicator */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {/* Standard Indian Veg/Non-Veg icon */}
                          <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                            item.isVeg ? 'border-emerald-500' : 'border-rose-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                            }`} />
                          </span>

                          <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                            {item.name}
                          </h4>
                        </div>

                        {item.hindiName && (
                          <div className="text-[11px] text-slate-400 mt-0.5 ml-5">
                            {item.hindiName}
                          </div>
                        )}
                      </div>

                      {item.hasVariants && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0">
                          Q / H / F
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Add Controls */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-750 flex items-center justify-between gap-2">
                    {item.hasVariants ? (
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 font-medium">From {formatCurrency(item.variants?.[0]?.price || item.price)}</div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.variants?.map(v => (
                            <button
                              key={v.name}
                              onClick={() => addItemToCart(item, v.name, v.price)}
                              className="px-2 py-1 rounded-md bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 text-[10px] font-bold text-slate-200 transition-colors"
                              title={`Add ${item.name} (${v.name}) - ${formatCurrency(v.price)}`}
                            >
                              {v.name[0]}: ₹{v.price}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-black text-amber-400 tabular-nums">
                        {formatCurrency(item.price)}
                      </div>
                    )}

                    {!item.hasVariants && (
                      <button
                        onClick={() => addItemToCart(item, 'Standard', item.price)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMenu.length === 0 && (
            <div className="p-8 rounded-2xl bg-slate-850 border border-slate-800 text-center text-slate-400 text-xs">
              No matching food items found for "{searchQuery}".
            </div>
          )}
        </div>

        {/* Right Column: Active Order Cart & Direct Submit (4-5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">
                  {orderType === 'room' ? `Room ${selectedRoomNumber} Order` : `Outside ${orderType.toUpperCase()}`}
                </h3>
              </div>

              {cartItems.length > 0 && (
                <button
                  onClick={() => setCartItems([])}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {cartItems.length > 0 ? (
                cartItems.map((item, idx) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-750 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        {item.variantName && item.variantName !== 'Standard' && (
                          <span className="text-amber-400 font-semibold">{item.variantName}</span>
                        )}
                        <span>₹{item.rate} each</span>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-750 rounded-lg p-0.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-white tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right shrink-0 min-w-14">
                      <div className="font-bold text-white tabular-nums">₹{item.total}</div>
                    </div>

                    <button
                      onClick={() => removeItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-400 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs space-y-1">
                  <ChefHat className="w-8 h-8 text-slate-600 mx-auto stroke-1 mb-2" />
                  <p className="font-medium text-slate-400">Cart is empty</p>
                  <p className="text-[11px]">Select items from the authentic Handi menu on the left to add</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {cartItems.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Special instructions (e.g. Less spicy, extra salad)..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Summary calculation */}
            {cartItems.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-mono text-slate-200 tabular-nums">{formatCurrency(subtotal)}</span>
                </div>

                {state.settings.gstEnabled && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>GST ({state.settings.gstPercent}%)</span>
                    <span className="font-mono text-slate-200 tabular-nums">+{formatCurrency(taxAmount)}</span>
                  </div>
                )}

                {/* Extra Charges list & add */}
                {extraCharges.length > 0 && (
                  <div className="space-y-1">
                    {extraCharges.map((ec, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <span>{ec.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraCharge(idx)}
                            className="text-rose-400 hover:text-rose-300 text-[10px]"
                          >
                            ✕
                          </button>
                        </span>
                        <span className="font-mono text-amber-400 tabular-nums">+{formatCurrency(ec.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Extra Charge button/input */}
                {!showAddChargeInput ? (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddChargeInput(true)}
                      className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{language === 'hi' ? '+ सर्विस चार्ज / पैकेजिंग जोड़ें' : '+ Add Service / Extra Charge'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-750 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={chargeNameInput}
                        onChange={(e) => setChargeNameInput(e.target.value)}
                        placeholder="e.g. Service Charge"
                        className="flex-1 px-2 py-1 bg-slate-850 border border-slate-700 rounded text-[11px] text-white"
                      />
                      <input
                        type="number"
                        min={1}
                        value={chargeAmtInput}
                        onChange={(e) => setChargeAmtInput(e.target.value)}
                        placeholder="₹"
                        className="w-16 px-2 py-1 bg-slate-850 border border-slate-700 rounded text-[11px] text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddExtraCharge}
                        className="px-2 py-1 bg-amber-500 text-slate-950 font-bold rounded text-[11px]"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddChargeInput(false)}
                        className="text-slate-400 hover:text-white px-1 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Discount */}
                <div className="flex items-center justify-between text-slate-400">
                  <span>Discount</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={discountAmount || ''}
                      onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="0"
                      className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-750 rounded text-right font-mono text-xs text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-750 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Grand Total</span>
                  <span className="text-lg font-black text-amber-400 tabular-nums">{formatCurrency(grandTotal)}</span>
                </div>

                <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                  <span>Billed By:</span>
                  <span className="text-slate-200 font-semibold">{currentStaff.name} ({currentStaff.role})</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSaveOrder}
              disabled={cartItems.length === 0 || submitting}
              className={`w-full py-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                cartItems.length > 0 && !submitting
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
              }`}
            >
              <ChefHat className="w-4 h-4 stroke-[2.5]" />
              <span>
                {submitting 
                  ? 'Saving Order...' 
                  : orderType === 'room'
                    ? `Send to Kitchen · Room ${selectedRoomNumber} (₹${grandTotal})`
                    : `Send to Kitchen · ${orderType.toUpperCase()} (₹${grandTotal})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
