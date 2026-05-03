import fitz
import json
import os

def extract_2024_paper(pdf_path):
    doc = fitz.open(pdf_path)
    
    out_dir = 'assets/q2024'
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)
        
    questions_data = []
    
    # 149 is the green checkmark xref, 151 is the red cross, 153 is footer
    # But just in case they change xrefs, we'll use size.
    # A checkmark/cross is < 20x20
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        text_blocks = page.get_text("blocks")
        image_info = page.get_image_info(xrefs=True)
        
        items = []
        for b in text_blocks:
            text = b[4].strip()
            if "Question Number :" in text:
                try:
                    q_num_str = text.split("Question Number :")[1].split("Question Id")[0].strip()
                    items.append({'type': 'q_header', 'y': b[1], 'text': q_num_str})
                except Exception:
                    pass
                    
        checkmarks = []
        for img in image_info:
            x0, y0, x1, y1 = img['bbox']
            w = x1 - x0
            h = y1 - y0
            xref = img['xref']
            
            # footer watermark
            if x0 > 450 and y0 > 750:
                continue
                
            # small icons (checkmarks/crosses)
            if w < 25 and h < 25:
                # Let's save the xref to identify if it's correct.
                # Actually, earlier we found xref 149 is green check, 151 is red cross.
                # Let's assume xref 149 is correct.
                is_correct = (xref == 149)
                
                # if we can't rely on xref, we can check the color! 
                # but xref 149 is consistently the green checkmark based on our test.
                # Wait, what if on some pages it's a different xref?
                # PyMuPDF lets us get the image bytes. Green check has a specific size.
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                # 149 usually has 214 bytes, 151 has 252 bytes. Let's just use xref 149 or size < 240 bytes.
                if len(image_bytes) < 230:
                    is_correct = True
                else:
                    is_correct = False
                    
                checkmarks.append({'y0': y0, 'y1': y1, 'is_correct': is_correct})
                continue
                
            items.append({'type': 'image', 'y': y0, 'xref': xref})
            
        items.sort(key=lambda x: x['y'])
        
        current_q = None
        if len(questions_data) > 0:
            current_q = questions_data[-1]
            
        for item in items:
            if item['type'] == 'q_header':
                current_q = {
                    'num': int(item['text']), 
                    'images': [],
                    'checkmarks': checkmarks # store all checkmarks on this page
                }
                questions_data.append(current_q)
            elif item['type'] == 'image':
                if current_q:
                    current_q['images'].append(item)
                    
    # Now process questions_data into JSON
    out_json = {'2024': {'title': 'Andhra Pradesh EAMCET 2024', 'questions': []}}
    
    for q in questions_data:
        q_num = q['num']
        images = q['images']
        checkmarks = q['checkmarks']
        
        # images[0] is stem, images[1:5] are options
        if len(images) != 5:
            print(f"Warning: Q{q_num} has {len(images)} images!")
            continue
            
        stem_xref = images[0]['xref']
        stem_img = doc.extract_image(stem_xref)
        stem_path = f'{out_dir}/q{q_num:03d}_stem.{stem_img["ext"]}'
        with open(stem_path, 'wb') as f:
            f.write(stem_img['image'])
            
        options = []
        correct_index = 0
        
        for opt_idx in range(4):
            opt_img_info = images[1 + opt_idx]
            opt_xref = opt_img_info['xref']
            opt_y = opt_img_info['y']
            
            # Check if there is a correct checkmark near this option's y
            # The checkmark's y0 should be close to opt_y
            # We can just see which checkmark is closest to this option vertically
            for mark in checkmarks:
                if mark['is_correct']:
                    if abs(mark['y0'] - opt_y) < 50: # within 50 pixels
                        correct_index = opt_idx
            
            o_img = doc.extract_image(opt_xref)
            opath = f'{out_dir}/q{q_num:03d}_opt_{opt_idx+1}.{o_img["ext"]}'
            with open(opath, 'wb') as f:
                f.write(o_img['image'])
                
            options.append({'text': '', 'image': opath})
            
        subject = 'Mathematics'
        if q_num > 80 and q_num <= 120: subject = 'Physics'
        if q_num > 120: subject = 'Chemistry'
            
        out_json['2024']['questions'].append({
            'id': q_num,
            'questionId': 4500000000 + q_num,
            'subject': subject,
            'question': f'Question {q_num}',
            'questionImages': [stem_path],
            'options': options,
            'correctOptionIndex': correct_index
        })
        
    out_json['2024']['questions'].sort(key=lambda x: x['id'])
        
    with open('data/question-papers-2024.js', 'w', encoding='utf-8') as f:
        f.write('window.CRAKMAX_PAPERS_2024 = ' + json.dumps(out_json) + ';')

    print(f"Successfully processed {len(out_json['2024']['questions'])} questions.")

if __name__ == '__main__':
    extract_2024_paper('AP_EAPCET_2024_Question_Paper_May_23_Shift_1_MPC.pdf')
