; AutoHotkey v2 script: Két egymás utáni kattintás megadott pozíciókra
; A kattintások között 0.2 másodperc szünet
; A scriptet később ismétlődőre is lehet módosítani

; --- Paraméterek ---
click1_x := 1791
click1_y := 665
click2_x := 1700
click2_y := 667
sleep_between := 200 ; ms (0.2 másodperc)

; --- Fő szekvencia ---
global stopLoop := false



F9:: {
    Loop 1000 {
        if _breakIfCtrlY() {
            ToolTip "Megszakítva: Ctrl+Y!"
            Sleep(1000)
            ToolTip
            break
        }
        MouseMove(click1_x, click1_y, 0)
        Click
        if _breakableSleep(sleep_between) {
            ToolTip "Megszakítva: Ctrl+Y!"
            Sleep(1000)
            ToolTip
            break
        }
        MouseMove(click2_x, click2_y, 0)
        Click
        if _breakableSleep(sleep_between) {
            ToolTip "Megszakítva: Ctrl+Y!"
            Sleep(1000)
            ToolTip
            break
        }
    }
}


_breakIfCtrlY() {
    return GetKeyState("y", "P") && GetKeyState("Ctrl", "P")
}


_breakableSleep(ms) {
    step := 10
    elapsed := 0
    while (elapsed < ms) {
        Sleep(step)
        elapsed += step
        if _breakIfCtrlY()
            return true
    }
    return false
}

; F9 indítja a ciklust, Ctrl+Y bármikor leállítja.
