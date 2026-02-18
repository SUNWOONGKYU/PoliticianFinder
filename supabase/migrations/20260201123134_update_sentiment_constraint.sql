-- Update sentiment constraint to allow 'free' value
ALTER TABLE collected_data_v40 DROP CONSTRAINT IF EXISTS collected_data_v40_sentiment_check;
ALTER TABLE collected_data_v40 ADD CONSTRAINT collected_data_v40_sentiment_check CHECK (sentiment IN ('positive', 'negative', 'neutral', 'free'));

-- Change existing 'neutral' to 'free' for 조은희
UPDATE collected_data_v40 SET sentiment = 'free' WHERE politician_id = 'd0a5d6e1' AND sentiment = 'neutral';
