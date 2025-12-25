-- 今井メッキ工業所のリサーチ結果に基づいた詳細なサンプルデータ
-- 既存データを削除してから挿入するわけではないので、重複しないように注意が必要ですが、
-- 今回は学習用・デモ用として追加挿入します。

-- --- めっき種マスター (platingTypes) ---
-- "IoTモニタリング" "極小部品" "特殊素材" などを意識した価格設定と名称
INSERT INTO "platingTypes" (id, name, "unitPrice", "costPerLot") VALUES
    (uuid_generate_v4()::text, '無電解ニッケル (Kanigen)', 50, 8000),      -- 代表的な技術
    (uuid_generate_v4()::text, '光沢ニッケル (極小部品対応)', 8, 3000),     -- 0.4mm対応
    (uuid_generate_v4()::text, '亜鉛めっき (三価クロメート)', 12, 4000),      -- 一般的だが高品質
    (uuid_generate_v4()::text, '亜鉛めっき (高耐食性黒色)', 15, 4500),
    (uuid_generate_v4()::text, '硬質クロム (工業用/耐摩耗性)', 120, 20000),
    (uuid_generate_v4()::text, '金めっき (電子接点用)', 300, 50000),        -- 高付加価値
    (uuid_generate_v4()::text, 'すずめっき (光沢/はんだ付け用)', 20, 5000),
    (uuid_generate_v4()::text, '無電解ニッケル-PTFE複合めっき', 80, 15000),  -- 特殊技術
    (uuid_generate_v4()::text, '無電解ニッケル-ボロンめっき', 90, 18000),    -- 特殊技術
    (uuid_generate_v4()::text, '化学研磨 (下処理)', 10, 2500);

-- --- 治具マスター (jigs) ---
-- スマートファクトリー(ランダム自動機)を意識した治具名称
INSERT INTO "jigs" (id, name, "totalQuantity") VALUES
    (uuid_generate_v4()::text, '自動機用汎用ラック (Aタイプ/64掛)', 64),
    (uuid_generate_v4()::text, '自動機用汎用ラック (Bタイプ/32掛)', 32),
    (uuid_generate_v4()::text, '精密極小バレル (φ0.4mm対応)', 5000),      -- 強みである極小部品用
    (uuid_generate_v4()::text, '標準回転バレル (Mサイズ)', 2000),
    (uuid_generate_v4()::text, '大容量回転バレル (Lサイズ)', 5000),
    (uuid_generate_v4()::text, '基板用専用フレーム (金めっきライン)', 20),
    (uuid_generate_v4()::text, 'シャフト用吊り下げ治具 (硬質クロム用)', 12),
    (uuid_generate_v4()::text, '特殊マスキング治具 (部分めっき用)', 20),
    (uuid_generate_v4()::text, '試作用手動ラインラック', 10),
    (uuid_generate_v4()::text, '通箱兼洗浄バスケット', 200);

-- --- 顧客マスター (clients) ---
-- 電子部品、精密機械、自動車関連を想定
INSERT INTO "clients" (id, name, "contactPerson") VALUES
    (uuid_generate_v4()::text, '光進電子部品株式会社', '佐藤 開発部長'),
    (uuid_generate_v4()::text, '中部オートモーティブシステムズ', '鈴木 購買課長'),
    (uuid_generate_v4()::text, '三河精密機器製作所', '高橋 品質保証課'),
    (uuid_generate_v4()::text, '大日本コネクタ工業', '田中 製造マネージャー'),
    (uuid_generate_v4()::text, 'フューチャー・メディカル・デバイス', '伊藤 技術営業');
