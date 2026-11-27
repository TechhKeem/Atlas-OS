"""Shot list, video-first (4 stills of 21). Each row: (source, media_start, timeline_start, text_y, side).

text_y / side = where the text stack (title or glass card + caption) sits on THIS shot, chosen by looking at the shot's
frames on a pixel grid (place/sheet*.jpg) so it never covers Hakeem or the people with him. side: L x100-660,
R x340-900, C x260-820. Close-ups with no free band are not used under widgets.
"""
def shots(S):
    return [
        # hook (title + chip + caption)
        ("0341_wide_stage", 0.0, 0.0, 300, "C"), ("0637_stage_wide", 2.0, 2.4, 300, "C"),
        ("0643_speaker", 3.0, 5.2, 300, "C"), ("D0BD_procon_walk", 2.0, 7.3, 300, "L"),
        # 1. James (card + caption)
        ("0644_panel2", 0.0, S["james"], 300, "R"), ("5362_cornhole", 0.8, 12.6, 300, "R"),
        ("7105_hillside.jpg", 0, S["crash"], 330, "L"), ("0642_pan", 0.3, 18.6, 300, "C"),
        ("5350_minigolf", 1.0, S["selling"], 310, "L"), ("0637_stage_wide", 5.0, 24.85, 300, "C"),
        ("0644_panel2", 6.0, 27.1, 300, "R"),
        # 2. Carol
        ("0637_stage_wide", 9.0, S["carol"], 300, "C"), ("0341_wide_stage", 2.6, 31.6, 300, "C"),
        ("5362_cornhole", 12.0, S["pension"], 300, "R"), ("5350_minigolf", 8.0, 36.5, 300, "R"),
        ("7356_seated_phone.jpg", 0, S["life"], 300, "C"), ("0643_speaker", 10.0, 42.0, 300, "C"),
        # 3. Result
        ("0644_panel2", 3.0, S["less"], 300, "R"), ("0637_stage_wide", 12.0, 48.6, 300, "C"),
        ("0643_speaker", 14.0, S["year26"], 300, "C"), ("0643_speaker", 6.0, 54.2, 300, "C"),
        # closer (captions only) -> end card
        ("wsl22_headshot.jpg", 0, S["closer"], 1144, "C"),
    ]
