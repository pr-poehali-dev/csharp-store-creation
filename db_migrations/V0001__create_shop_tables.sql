
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  rating NUMERIC(3,1) DEFAULT 4.5,
  reviews_count INTEGER DEFAULT 0,
  image TEXT,
  badge TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'standard',
  address TEXT,
  items JSONB NOT NULL,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO products (name, price, category, rating, reviews_count, image, badge) VALUES
('Набор для уборки «Чистый дом»', 1290, 'Уборка', 4.8, 124, 'https://cdn.poehali.dev/projects/cb5ab11c-9e61-45ff-a91e-479e9a6da764/files/8ce6e541-f7fa-4b5a-bbec-44b3391a407a.jpg', 'Хит'),
('Щётка для посуды бамбуковая', 390, 'Кухня', 4.6, 87, 'https://cdn.poehali.dev/projects/cb5ab11c-9e61-45ff-a91e-479e9a6da764/files/ffa5c5ee-a298-4674-8c10-38964bc1aa33.jpg', NULL),
('Спрей универсальный 500мл', 290, 'Химия', 4.9, 203, 'https://cdn.poehali.dev/projects/cb5ab11c-9e61-45ff-a91e-479e9a6da764/files/8ce6e541-f7fa-4b5a-bbec-44b3391a407a.jpg', 'Новинка'),
('Мусорное ведро с педалью 30л', 2490, 'Хранение', 4.7, 56, 'https://cdn.poehali.dev/projects/cb5ab11c-9e61-45ff-a91e-479e9a6da764/files/3c26a267-a6d7-4eec-ab1f-90cf6894e70b.jpg', NULL),
('Губки кухонные (10 шт.)', 189, 'Кухня', 4.5, 312, 'https://cdn.poehali.dev/projects/cb5ab11c-9e61-45ff-a91e-479e9a6da764/files/8ce6e541-f7fa-4b5a-bbec-44b3391a407a.jpg', NULL),
('Швабра с отжимом', 1890, 'Уборка', 4.8, 94, 'https://cdn.poehali.dev/projects/cb5ab11c-9e61-45ff-a91e-479e9a6da764/files/ffa5c5ee-a298-4674-8c10-38964bc1aa33.jpg', 'Акция'),
('Перчатки резиновые (пара)', 149, 'Уборка', 4.4, 178, 'https://cdn.poehali.dev/projects/cb5ab11c-9e61-45ff-a91e-479e9a6da764/files/8ce6e541-f7fa-4b5a-bbec-44b3391a407a.jpg', NULL),
('Корзина плетёная 35×25', 890, 'Хранение', 4.9, 41, 'https://cdn.poehali.dev/projects/cb5ab11c-9e61-45ff-a91e-479e9a6da764/files/3c26a267-a6d7-4eec-ab1f-90cf6894e70b.jpg', NULL);

INSERT INTO reviews (product_name, author, rating, text, created_at) VALUES
('Набор для уборки «Чистый дом»', 'Анна К.', 5, 'Отличное качество товаров! Заказываю здесь уже третий раз, всегда всё приходит быстро и в целости.', '2026-03-15'),
('Швабра с отжимом', 'Михаил Р.', 4, 'Хороший магазин. Цены адекватные, доставка курьером на следующий день. Рекомендую.', '2026-04-02'),
('Щётка для посуды бамбуковая', 'Елена В.', 5, 'Бамбуковые щётки — просто находка! Экологично, красиво и практично. Теперь буду брать только здесь.', '2026-04-05');
