-- ユーザーを追加するSQL
-- SupabaseのSQL Editorで実行してください

INSERT INTO users (id, username, name, role, password)
VALUES (
    uuid_generate_v4()::text,       -- 自動生成ID
    'yusaku.suzuki@sou-zou-do.com', -- ユーザー名（メールアドレス）
    '鈴木 優作',                    -- 表示名
    'admin',                        -- 権限
    'Yusaku0310!'                   -- パスワード
);
