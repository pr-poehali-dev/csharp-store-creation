"""
API магазина хозтоваров: товары, отзывы, заказы.
GET /products — список товаров (фильтр ?category=)
GET /reviews — список отзывов
POST /reviews — добавить отзыв
POST /orders — оформить заказ
"""
import json
import os
import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    dsn = os.environ['DATABASE_URL']
    if '?' not in dsn:
        dsn += '?sslmode=disable'
    return psycopg2.connect(dsn, cursor_factory=psycopg2.extras.RealDictCursor)

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'products')

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET products
        if method == 'GET' and action == 'products':
            category = params.get('category')
            if category and category != 'Все':
                cur.execute('SELECT * FROM products WHERE category = %s ORDER BY id', (category,))
            else:
                cur.execute('SELECT * FROM products ORDER BY id')
            rows = [dict(r) for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(rows, ensure_ascii=False, default=str)}

        # GET reviews
        if method == 'GET' and action == 'reviews':
            cur.execute('SELECT * FROM reviews ORDER BY created_at DESC')
            rows = [dict(r) for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(rows, ensure_ascii=False, default=str)}

        # POST review
        if method == 'POST' and action == 'reviews':
            body = json.loads(event.get('body') or '{}')
            author = body.get('author', '').strip()
            product_name = body.get('product_name', '').strip()
            rating = int(body.get('rating', 5))
            text = body.get('text', '').strip()
            if not author or not product_name or not text:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
            cur.execute(
                'INSERT INTO reviews (author, product_name, rating, text) VALUES (%s, %s, %s, %s) RETURNING *',
                (author, product_name, rating, text)
            )
            row = dict(cur.fetchone())
            conn.commit()
            return {'statusCode': 201, 'headers': CORS, 'body': json.dumps(row, ensure_ascii=False, default=str)}

        # POST order
        if method == 'POST' and action == 'orders':
            body = json.loads(event.get('body') or '{}')
            name = body.get('customer_name', '').strip()
            phone = body.get('customer_phone', '').strip()
            items = body.get('items', [])
            total = int(body.get('total', 0))
            delivery_type = body.get('delivery_type', 'standard')
            address = body.get('address', '').strip()
            if not name or not phone or not items:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
            cur.execute(
                'INSERT INTO orders (customer_name, customer_phone, delivery_type, address, items, total) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id',
                (name, phone, delivery_type, address, json.dumps(items, ensure_ascii=False), total)
            )
            order_id = cur.fetchone()['id']
            conn.commit()
            return {'statusCode': 201, 'headers': CORS, 'body': json.dumps({'order_id': order_id, 'message': 'Заказ принят!'}, ensure_ascii=False)}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()