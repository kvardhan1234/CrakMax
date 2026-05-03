import fitz

def extract_test(pdf_path):
    doc = fitz.open(pdf_path)
    
    # Page 2 has Q1
    page = doc[1]
    
    # get text blocks
    text_blocks = page.get_text("blocks")
    print("Page 2 Text Blocks:")
    for b in text_blocks:
        print(f"BBox: {b[:4]}, Text: {b[4][:50].strip()}")
        
    print("\nPage 2 Images:")
    image_info = page.get_image_info(xrefs=True)
    for img in image_info:
        print(f"BBox: {img['bbox']}, xref: {img['xref']}")

    # Page 3 has Q2
    page = doc[2]
    
    # get text blocks
    text_blocks = page.get_text("blocks")
    print("\nPage 3 Text Blocks:")
    for b in text_blocks:
        if "Question Number" in b[4] or "Options" in b[4] or b[4].strip() in ["1.", "2.", "3.", "4."]:
            print(f"BBox: {b[:4]}, Text: {b[4][:50].strip()}")
        
    print("\nPage 3 Images:")
    image_info = page.get_image_info(xrefs=True)
    for img in image_info:
        print(f"BBox: {img['bbox']}, xref: {img['xref']}")

if __name__ == '__main__':
    extract_test('AP_EAPCET_2024_Question_Paper_May_23_Shift_1_MPC.pdf')
