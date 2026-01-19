; AutoHotkey script: Két egymás utáni kattintás megadott pozíciókra
; A kattintások között 0.5 másodperc szünet
; A scriptet később ismétlődőre is lehet módosítani

#NoEnv  ; Ajánlott beállítás
SendMode Input  ; Gyorsabb küldés
SetWorkingDir %A_ScriptDir%  ; Script könyvtára

; --- Paraméterek ---
click1_x := 1791
click1_y := 665
click2_x := 1700
click2_y := 667
sleep_between := 500 ; ms (0.5 másodperc)

; --- Fő szekvencia ---
F9::
    MouseMove, %click1_x%, %click1_y%, 0
    Click
    Sleep, %sleep_between%
    MouseMove, %click2_x%, %click2_y%, 0
    Click
return

; F9 billentyű lenyomására fut le egyszer a két kattintás.
; Ha ismételni szeretnéd, a szekvenciát ciklusba kell tenni (Loop).
