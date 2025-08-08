-- Function to match context chunks with similarity search
CREATE OR REPLACE FUNCTION match_context_chunks(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT,
    context_weight INTEGER
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
        cc.context_weight
    FROM context_chunks cc
    WHERE cc.embedding IS NOT NULL
    AND (cc.embedding <=> query_embedding) < match_threshold
    ORDER BY (cc.embedding <=> query_embedding) * (100.0 / GREATEST(cc.context_weight, 1)) ASC
    LIMIT match_count;
END;
$$; 