import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const API = "https://functions.poehali.dev/2e19cf24-9650-4077-ac10-4e4f408e3708";

const HERO_IMG = "https://cdn.poehali.dev/projects/cb5ab11c-9e61-45ff-a91e-479e9a6da764/files/ffa5c5ee-a298-4674-8c10-38964bc1aa33.jpg";
const STORE_IMG = "https://cdn.poehali.dev/projects/cb5ab11c-9e61-45ff-a91e-479e9a6da764/files/3c26a267-a6d7-4eec-ab1f-90cf6894e70b.jpg";

type Section = "home" | "catalog" | "about" | "contacts" | "cart" | "delivery";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  rating: number;
  reviews_count: number;
  image: string;
  badge?: string;
}

interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  created_at: string;
  product_name: string;
}

const CATEGORIES = ["Все", "Уборка", "Кухня", "Химия", "Хранение"];

function ReviewStars({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            fontSize: interactive ? 22 : 15,
            cursor: interactive ? "pointer" : "default",
            color: star <= (hover || rating) ? "#c8793a" : "#ddd",
            lineHeight: 1,
          }}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate && onRate(star)}
        >★</span>
      ))}
    </div>
  );
}

function formatDate(str: string) {
  try {
    return new Date(str).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return str;
  }
}

export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cartItems, setCartItems] = useState<{ product: Product; qty: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [newReview, setNewReview] = useState({ author: "", text: "", rating: 5, product_name: "" });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [orderForm, setOrderForm] = useState({ customer_name: "", customer_phone: "", address: "", delivery_type: "standard" });
  const [orderDone, setOrderDone] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}?action=products`).then(r => r.json()),
      fetch(`${API}?action=reviews`).then(r => r.json()),
    ]).then(([prods, revs]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setReviews(Array.isArray(revs) ? revs : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadReviews = () => {
    fetch(`${API}?action=reviews`).then(r => r.json()).then(revs => {
      setReviews(Array.isArray(revs) ? revs : []);
    });
  };

  const loadProducts = (cat?: string) => {
    const url = cat && cat !== "Все" ? `${API}?action=products&category=${encodeURIComponent(cat)}` : `${API}?action=products`;
    fetch(url).then(r => r.json()).then(prods => setProducts(Array.isArray(prods) ? prods : []));
  };

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (id: number) => setCartItems(prev => prev.filter(i => i.product.id !== id));
  const changeQty = (id: number, delta: number) => {
    setCartItems(prev => prev.map(i => i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    loadProducts(cat);
  };

  const handleSubmitReview = async () => {
    if (!newReview.author || !newReview.text || !newReview.product_name) return;
    const res = await fetch(`${API}?action=reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newReview),
    });
    if (res.ok) {
      setNewReview({ author: "", text: "", rating: 5, product_name: "" });
      setReviewSubmitted(true);
      setTimeout(() => setReviewSubmitted(false), 3000);
      loadReviews();
    }
  };

  const handleOrder = async () => {
    if (!orderForm.customer_name || !orderForm.customer_phone) return;
    const res = await fetch(`${API}?action=orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...orderForm,
        items: cartItems.map(i => ({ id: i.product.id, name: i.product.name, qty: i.qty, price: i.product.price })),
        total: cartTotal,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setOrderDone(data.order_id);
      setCartItems([]);
    }
  };

  const navItems: { id: Section; label: string }[] = [
    { id: "home", label: "Главная" },
    { id: "catalog", label: "Каталог" },
    { id: "about", label: "О магазине" },
    { id: "delivery", label: "Доставка" },
    { id: "contacts", label: "Контакты" },
  ];

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-card rounded border border-border hover-lift group">
      <div className="aspect-square overflow-hidden rounded-t relative">
        <img src={product.image || HERO_IMG} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {product.badge && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">{product.badge}</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
        <p className="text-sm font-medium text-foreground leading-snug mb-2">{product.name}</p>
        <div className="flex items-center gap-1 mb-3">
          <ReviewStars rating={Number(product.rating)} />
          <span className="text-xs text-muted-foreground">({product.reviews_count})</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-foreground">{Number(product.price).toLocaleString()} ₽</span>
          <button onClick={() => addToCart(product)} className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors">
            <Icon name="Plus" size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => setSection("home")} className="flex items-center gap-2">
              <span className="text-2xl font-display italic font-semibold text-foreground tracking-tight">ДомПростор</span>
            </button>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => setSection(item.id)}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${section === item.id ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`}>
                  {item.label}
                </button>
              ))}
            </nav>
            <button onClick={() => setSection("cart")}
              className="relative flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Icon name="ShoppingCart" size={16} />
              <span className="hidden sm:inline">Корзина</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">{cartCount}</span>
              )}
            </button>
          </div>
          <div className="flex md:hidden gap-1 pb-2 overflow-x-auto">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setSection(item.id)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded transition-colors ${section === item.id ? "text-foreground bg-secondary" : "text-muted-foreground"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        {/* HOME */}
        {section === "home" && (
          <div className="animate-fade-in">
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
              <div className="animate-slide-up">
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-4">Хозтовары с характером</p>
                <h1 className="font-display text-5xl md:text-7xl italic font-semibold text-foreground leading-none mb-6">
                  Дом,<br />в котором<br />хочется жить
                </h1>
                <p className="text-muted-foreground text-lg mb-8 max-w-md">
                  Качественные хозяйственные товары для вашего дома — с доставкой до двери на следующий день.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button onClick={() => setSection("catalog")} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base rounded">
                    Перейти в каталог
                  </Button>
                  <Button onClick={() => setSection("delivery")} variant="outline" className="px-8 py-6 text-base rounded border-border">
                    Условия доставки
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded overflow-hidden shadow-2xl">
                  <img src={HERO_IMG} alt="Хозтовары" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded p-4 shadow-lg">
                  <p className="text-xs text-muted-foreground">Средний рейтинг</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-foreground">4.8</span>
                    <ReviewStars rating={5} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">на основе {reviews.length > 0 ? reviews.length * 34 : 1095} отзывов</p>
                </div>
              </div>
            </section>

            <section className="bg-secondary/40 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: "Truck", title: "Доставка за 1 день", desc: "По всему городу" },
                  { icon: "Shield", title: "Гарантия качества", desc: "На все товары" },
                  { icon: "RotateCcw", title: "Возврат 14 дней", desc: "Без вопросов" },
                  { icon: "Headphones", title: "Поддержка 8–22", desc: "Каждый день" },
                ].map((f) => (
                  <div key={f.title} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Icon name={f.icon} size={20} className="text-primary" />
                    </div>
                    <p className="font-semibold text-sm text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">Рекомендуем</p>
                  <h2 className="font-display text-4xl italic font-semibold">Популярное</h2>
                </div>
                <button onClick={() => setSection("catalog")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  Все товары <Icon name="ArrowRight" size={14} />
                </button>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-secondary rounded animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </section>

            {reviews.length > 0 && (
              <section className="bg-secondary/30 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                  <div className="mb-8">
                    <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">Мнения покупателей</p>
                    <h2 className="font-display text-4xl italic font-semibold">Отзывы</h2>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {reviews.slice(0, 3).map(review => (
                      <div key={review.id} className="bg-card rounded border border-border p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-sm">{review.author}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                          </div>
                          <ReviewStars rating={review.rating} />
                        </div>
                        <p className="text-xs text-muted-foreground italic mb-2">«{review.product_name}»</p>
                        <p className="text-sm text-foreground leading-relaxed">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="aspect-[4/3] rounded overflow-hidden">
                  <img src={STORE_IMG} alt="Магазин" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Наш магазин</p>
                  <h2 className="font-display text-4xl italic font-semibold mb-4">10 лет на рынке</h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Мы собрали всё лучшее для вашего дома — от профессиональных средств уборки до стильных аксессуаров для кухни. Каждый товар проходит проверку качества перед тем, как попасть в ассортимент.
                  </p>
                  <Button onClick={() => setSection("about")} variant="outline" className="rounded border-border">
                    Узнать больше о нас
                  </Button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* CATALOG */}
        {section === "catalog" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">
            <div className="mb-8">
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">Ассортимент</p>
              <h1 className="font-display text-5xl italic font-semibold">Каталог</h1>
            </div>
            <div className="flex gap-2 flex-wrap mb-8">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors border ${selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
                  {cat}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-square bg-secondary rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            <div className="mt-16 border-t border-border pt-12">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">Покупатели говорят</p>
                  <h2 className="font-display text-4xl italic font-semibold">Отзывы и оценки</h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground">4.8</p>
                  <ReviewStars rating={5} />
                  <p className="text-xs text-muted-foreground mt-1">{reviews.length} отзывов</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {reviews.map(review => (
                  <div key={review.id} className="bg-card rounded border border-border p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm">{review.author}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                      </div>
                      <ReviewStars rating={review.rating} />
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-2">Товар: «{review.product_name}»</p>
                    <p className="text-sm text-foreground leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded border border-border p-6 max-w-xl">
                <h3 className="font-semibold text-lg mb-4">Оставить отзыв</h3>
                {reviewSubmitted && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 mb-4 text-sm text-green-800">
                    Спасибо! Ваш отзыв опубликован.
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Ваше имя</label>
                    <input className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="Имя и первая буква фамилии" value={newReview.author}
                      onChange={e => setNewReview({ ...newReview, author: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Товар</label>
                    <select className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      value={newReview.product_name} onChange={e => setNewReview({ ...newReview, product_name: e.target.value })}>
                      <option value="">Выберите товар</option>
                      {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Оценка</label>
                    <ReviewStars rating={newReview.rating} interactive onRate={r => setNewReview({ ...newReview, rating: r })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Ваш отзыв</label>
                    <textarea className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring h-24 resize-none"
                      placeholder="Поделитесь впечатлениями о товаре..." value={newReview.text}
                      onChange={e => setNewReview({ ...newReview, text: e.target.value })} />
                  </div>
                  <Button onClick={handleSubmitReview} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Опубликовать отзыв
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABOUT */}
        {section === "about" && (
          <div className="animate-fade-in">
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">История</p>
              <h1 className="font-display text-5xl italic font-semibold mb-12">О магазине</h1>
              <div className="grid md:grid-cols-2 gap-16 items-start">
                <div className="aspect-[4/3] rounded overflow-hidden">
                  <img src={STORE_IMG} alt="О нас" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-6">
                  <p className="text-lg text-foreground leading-relaxed">
                    Магазин «ДомПростор» работает с 2014 года. За это время мы стали надёжным поставщиком хозяйственных товаров для тысяч семей нашего города.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Мы тщательно отбираем каждый товар — нам важно, чтобы вы получали только проверенные, качественные вещи. В нашем ассортименте более 500 наименований.
                  </p>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    {[{ num: "10+", label: "лет на рынке" }, { num: "500+", label: "товаров" }, { num: "12 000+", label: "клиентов" }].map(stat => (
                      <div key={stat.label} className="text-center border border-border rounded p-4">
                        <p className="font-display text-3xl italic font-semibold text-foreground">{stat.num}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            <section className="bg-secondary/30 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <h2 className="font-display text-3xl italic font-semibold mb-8 text-center">Наши ценности</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { icon: "Leaf", title: "Экологичность", desc: "Стараемся включать в ассортимент экологически ответственные товары из натуральных материалов." },
                    { icon: "Award", title: "Качество прежде всего", desc: "Каждый товар проходит проверку перед попаданием на полку." },
                    { icon: "Heart", title: "Забота о клиентах", desc: "Мы готовы ответить на любой вопрос и помочь подобрать нужный товар." },
                  ].map(v => (
                    <div key={v.title} className="bg-card rounded border border-border p-6">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Icon name={v.icon} size={18} className="text-primary" />
                      </div>
                      <h3 className="font-semibold text-base mb-2">{v.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* DELIVERY */}
        {section === "delivery" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 animate-fade-in">
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">Логистика</p>
            <h1 className="font-display text-5xl italic font-semibold mb-12">Доставка</h1>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {[
                { icon: "Zap", title: "Экспресс-доставка", price: "от 299 ₽", desc: "В течение 2–4 часов в пределах города.", badge: "Популярно" },
                { icon: "Truck", title: "Стандартная доставка", price: "от 199 ₽", desc: "На следующий день. При заказе от 3000 ₽ — бесплатно.", badge: null },
                { icon: "Package", title: "Самовывоз", price: "Бесплатно", desc: "Готовность — в течение 1 часа после заказа.", badge: null },
                { icon: "Building", title: "Доставка в офис", price: "от 499 ₽", desc: "Юридическим лицам — счёт и документы.", badge: null },
              ].map(d => (
                <div key={d.title} className="bg-card rounded border border-border p-6 relative">
                  {d.badge && <span className="absolute top-4 right-4 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">{d.badge}</span>}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon name={d.icon} size={18} className="text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{d.title}</h3>
                  <p className="text-xl font-bold text-foreground mb-3">{d.price}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-secondary/40 rounded border border-border p-6">
              <h2 className="font-semibold text-lg mb-4">Важная информация</h2>
              <ul className="space-y-2">
                {["Доставка ежедневно с 9:00 до 22:00", "При заказе от 3 000 ₽ — стандартная доставка бесплатно", "Курьер позвонит за 30 минут до приезда", "Оплата наличными и картой при получении"].map(item => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <Icon name="Check" size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* CONTACTS */}
        {section === "contacts" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 animate-fade-in">
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">Связь</p>
            <h1 className="font-display text-5xl italic font-semibold mb-12">Контакты</h1>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                {[
                  { icon: "MapPin", label: "Адрес", value: "ул. Примерная, 42, офис 7\nМосква, 123456" },
                  { icon: "Phone", label: "Телефон", value: "+7 (495) 123-45-67" },
                  { icon: "Mail", label: "Email", value: "hello@domprostor.ru" },
                  { icon: "Clock", label: "Режим работы", value: "Пн–Вс: 9:00–21:00" },
                ].map(c => (
                  <div key={c.label} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name={c.icon} size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{c.label}</p>
                      <p className="text-sm text-foreground whitespace-pre-line">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-card rounded border border-border p-6">
                <h3 className="font-semibold text-lg mb-4">Напишите нам</h3>
                <div className="space-y-3">
                  <input className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Ваше имя" />
                  <input className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="+7 (999) 000-00-00" />
                  <textarea className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring h-28 resize-none" placeholder="Ваш вопрос..." />
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Отправить сообщение</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CART */}
        {section === "cart" && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 animate-fade-in">
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">Покупки</p>
            <h1 className="font-display text-5xl italic font-semibold mb-12">Корзина</h1>

            {orderDone ? (
              <div className="text-center py-24">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <Icon name="CheckCircle" size={40} className="text-green-600" />
                </div>
                <p className="text-2xl font-semibold text-foreground mb-2">Заказ №{orderDone} принят!</p>
                <p className="text-muted-foreground mb-6">Мы свяжемся с вами для подтверждения в ближайшее время.</p>
                <Button onClick={() => { setOrderDone(null); setSection("catalog"); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Продолжить покупки
                </Button>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                  <Icon name="ShoppingCart" size={32} className="text-muted-foreground" />
                </div>
                <p className="text-xl font-medium text-foreground mb-2">Корзина пуста</p>
                <p className="text-muted-foreground mb-6">Добавьте товары из каталога</p>
                <Button onClick={() => setSection("catalog")} className="bg-primary text-primary-foreground hover:bg-primary/90">Перейти в каталог</Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-3">
                  {cartItems.map(({ product, qty }) => (
                    <div key={product.id} className="bg-card rounded border border-border p-4 flex gap-4 items-center">
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <img src={product.image || HERO_IMG} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">{product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{Number(product.price).toLocaleString()} ₽ / шт.</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => changeQty(product.id, -1)} className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                          <Icon name="Minus" size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{qty}</span>
                        <button onClick={() => changeQty(product.id, 1)} className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                          <Icon name="Plus" size={12} />
                        </button>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="font-bold text-foreground">{(Number(product.price) * qty).toLocaleString()} ₽</p>
                        <button onClick={() => removeFromCart(product.id)} className="text-xs text-muted-foreground hover:text-destructive transition-colors mt-1">удалить</button>
                      </div>
                    </div>
                  ))}

                  {/* Order form */}
                  <div className="bg-card rounded border border-border p-5 mt-4">
                    <h3 className="font-semibold text-base mb-3">Данные для доставки</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Ваше имя *</label>
                          <input className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Имя и фамилия" value={orderForm.customer_name}
                            onChange={e => setOrderForm({ ...orderForm, customer_name: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Телефон *</label>
                          <input className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="+7 (999) 000-00-00" value={orderForm.customer_phone}
                            onChange={e => setOrderForm({ ...orderForm, customer_phone: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Способ получения</label>
                        <select className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                          value={orderForm.delivery_type} onChange={e => setOrderForm({ ...orderForm, delivery_type: e.target.value })}>
                          <option value="standard">Стандартная доставка (от 199 ₽)</option>
                          <option value="express">Экспресс (от 299 ₽)</option>
                          <option value="pickup">Самовывоз (бесплатно)</option>
                        </select>
                      </div>
                      {orderForm.delivery_type !== "pickup" && (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Адрес доставки</label>
                          <input className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Улица, дом, квартира" value={orderForm.address}
                            onChange={e => setOrderForm({ ...orderForm, address: e.target.value })} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-card rounded border border-border p-5 sticky top-24">
                    <h3 className="font-semibold text-base mb-4">Итого</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Товары ({cartCount} шт.)</span>
                        <span>{cartTotal.toLocaleString()} ₽</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Доставка</span>
                        <span className={cartTotal >= 3000 ? "text-green-600" : ""}>{cartTotal >= 3000 || orderForm.delivery_type === "pickup" ? "Бесплатно" : "от 199 ₽"}</span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-3 mb-4">
                      <div className="flex justify-between font-bold text-lg">
                        <span>К оплате</span>
                        <span>{cartTotal.toLocaleString()} ₽</span>
                      </div>
                      {cartTotal < 3000 && orderForm.delivery_type === "standard" && (
                        <p className="text-xs text-muted-foreground mt-1">До бесплатной доставки: {(3000 - cartTotal).toLocaleString()} ₽</p>
                      )}
                    </div>
                    <Button onClick={handleOrder} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-5">
                      Оформить заказ
                    </Button>
                    <button onClick={() => setSection("catalog")} className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors">
                      Продолжить покупки
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <p className="font-display text-xl italic font-semibold mb-3">ДомПростор</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Всё лучшее для вашего дома — с 2014 года.</p>
            </div>
            {[
              { title: "Магазин", links: ["Главная", "Каталог", "Акции"] },
              { title: "Информация", links: ["О магазине", "Доставка", "Возврат"] },
              { title: "Контакты", links: ["+7 (495) 123-45-67", "hello@domprostor.ru", "Пн–Вс 9:00–21:00"] },
            ].map(col => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{col.title}</p>
                <ul className="space-y-1.5">
                  {col.links.map(link => <li key={link} className="text-sm text-muted-foreground">{link}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-8 pt-6 text-xs text-muted-foreground text-center">
            © 2026 ДомПростор. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}
