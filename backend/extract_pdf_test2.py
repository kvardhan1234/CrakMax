import fitz

def validate_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    
    questions = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Get text blocks
        text_blocks = page.get_text("blocks")
        
        # Get images
        image_info = page.get_image_info(xrefs=True)
        
        items = []
        for b in text_blocks:
            text = b[4].strip()
            if "Question Number :" in text:
                q_num_str = text.split("Question Number :")[1].split("Question Id")[0].strip()
                items.append({'type': 'q_header', 'y': b[1], 'text': q_num_str})
                
        for img in image_info:
            x0, y0, x1, y1 = img['bbox']
            w = x1 - x0
            h = y1 - y0
            if w < 20 and h < 20: continue # checkmark
            if x0 > 450 and y0 > 750: continue # footer logo
            items.append({'type': 'image', 'y': y0, 'xref': img['xref']})
            
        items.sort(key=lambda x: x['y'])
        
        current_q = None
        # if a question started on the previous page, it might continue here!
        if len(questions) > 0:
            current_q = questions[-1]
            
        for item in items:
            if item['type'] == 'q_header':
                current_q = {'num': item['text'], 'images': []}
                questions.append(current_q)
            elif item['type'] == 'image':
                if current_q:
                    current_q['images'].append(item['xref'])

    print(f"Total Questions: {len(questions)}")
    for q in questions[:5]:
        print(f"Q {q['num']}: {len(q['images'])} images")
        
    # Check for anomalies
    anomalies = [q for q in questions if len(q['images']) != 5]
    print(f"Anomalies (questions without exactly 5 images): {len(anomalies)}")
    for q in anomalies[:5]:
        print(f"Anomaly Q {q['num']}: {len(q['images'])} images")

if __name__ == '__main__':
    validate_pdf('AP_EAPCET_2024_Question_Paper_May_23_Shift_1_MPC.pdf')
