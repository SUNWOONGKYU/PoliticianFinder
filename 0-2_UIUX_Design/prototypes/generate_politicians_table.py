import json

# Read mock data
with open('html/assets/mock-data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

politicians = data['politicians']

# Grade mapping based on composite_score
def get_grade(score):
    if score >= 93:
        return "🌺 Mugunghwa"
    elif score >= 86:
        return "💎 Diamond"
    elif score >= 79:
        return "💚 Emerald"
    elif score >= 72:
        return "🥇 Platinum"
    elif score >= 65:
        return "🥇 Gold"
    elif score >= 58:
        return "🥈 Silver"
    elif score >= 51:
        return "🥉 Bronze"
    else:
        return "⚫ Iron"

# Generate table rows
rows = []
for idx, pol in enumerate(politicians, 1):
    # Parse region
    region_full = pol['region']
    if ' ' in region_full:
        region_parts = region_full.split(' ')
        region = region_parts[0]
        district = ' '.join(region_parts[1:])
    else:
        region = region_full
        district = ""
    
    grade = get_grade(pol['composite_score'])
    
    # Calculate star rating
    rating = pol['member_rating']
    if rating >= 4.5:
        stars = "★★★★★"
    elif rating >= 3.5:
        stars = "★★★★☆"
    elif rating >= 2.5:
        stars = "★★★☆☆"
    elif rating >= 1.5:
        stars = "★★☆☆☆"
    else:
        stars = "★☆☆☆☆"
    
    row = f'''                        <tr class="hover:bg-gray-50 cursor-pointer" data-name="{pol['name']}" data-status="{pol['status']}" data-category="{pol['category']}" data-position="{pol['position']}" data-party="{pol['party']}" data-region="{region}" data-district="{district}" onclick="location.href='politician-detail.html'">
                            <td class="px-2 py-3 text-center"><span class="font-bold text-gray-900 text-base">{idx}</span></td>
                            <td class="px-3 py-3"><span class="font-bold text-primary-600 hover:text-primary-700 text-sm cursor-pointer inline-flex items-center gap-1">{pol['name']} <span class="text-xs">›</span></span></td>
                            <td class="px-2 py-3 text-gray-600 text-xs">{pol['status']}</td>
                            <td class="px-2 py-3 text-gray-600 text-xs">{pol['position']}</td>
                            <td class="px-2 py-3 text-gray-600 text-xs">{pol['category']}</td>
                            <td class="px-2 py-3 text-gray-600 text-xs">{pol['party']}</td>
                            <td class="px-2 py-3 text-gray-600 text-xs">{region_full}</td>
                            <td class="px-2 py-3 text-center text-xs font-semibold text-accent-600">{grade}</td>
                            <td class="px-2 py-3 text-center font-bold text-accent-600">{pol['composite_score']}</td>
                            <td class="px-2 py-3 text-center font-bold text-accent-600">{pol['claude_score']}.0</td>
                            <td class="px-2 py-3 text-center font-bold text-accent-600">{pol['gpt_score']}.0</td>
                            <td class="px-2 py-3 text-center font-bold text-accent-600">{pol['gemini_score']}.0</td>
                            <td class="px-2 py-3 text-center font-bold text-accent-600">{pol['grok_score']}.0</td>
                            <td class="px-2 py-3 text-center font-bold text-accent-600">{pol['perplexity_score']}.0</td>
                            <td class="px-2 py-3 text-center text-xs">
                                <span class="font-bold text-secondary-600">{stars}</span> <span class="text-gray-900">({pol['member_rating_count']}명)</span>
                            </td>
                        </tr>'''
    rows.append(row)

# Write to file
output = '\n'.join(rows)
with open('politicians_table_rows.txt', 'w', encoding='utf-8') as f:
    f.write(output)

print(f"Generated {len(rows)} politician rows")
