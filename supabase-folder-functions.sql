-- Function to match context chunks with folder filtering and context weight
CREATE OR REPLACE FUNCTION match_context_chunks_with_folders(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5,
    folder_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT,
    context_weight INTEGER,
    folder_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.content,
        cc.metadata,
        (cc.embedding <=> query_embedding) AS similarity,
        cc.context_weight,
        f.name AS folder_name
    FROM context_chunks cc
    LEFT JOIN folders f ON cc.metadata->>'folder_id' = f.id::TEXT
    WHERE cc.embedding IS NOT NULL
    AND (cc.embedding <=> query_embedding) < match_threshold
    AND (
        folder_ids IS NULL 
        OR cc.metadata->>'folder_id' = ANY(SELECT unnest(folder_ids)::TEXT)
        OR f.include_in_context = TRUE
    )
    ORDER BY (cc.embedding <=> query_embedding) * (100.0 / GREATEST(cc.context_weight, 1)) ASC
    LIMIT match_count;
END;
$$; 