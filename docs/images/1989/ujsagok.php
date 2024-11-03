<head>
  <title></title>
  
  <LINK REL="stylesheet" HREF="menu_css.css" TYPE="text/css" TITLE="Ledger stylesheet">
  <LINK REL="Alternate Stylesheet" HREF="css/printing.css" TYPE="text/css" TITLE="Print">
  
  <META HTTP-EQUIV="Content-Type" CONTENT="text/plain; charset=ISO-8859-2">
  
</head>



<script type="text/javascript">

function SwitchMenu(obj) {
  if (document.getElementById) {
    var el = document.getElementById(obj);
    var ar = document.getElementById("cont").getElementsByTagName("DIV");

    if (el.style.display == "none") {
      el.style.display = "block"; //display the block of info
    } else {
      el.style.display = "none";
    }
  }
}

function ChangeClass(menu, newClass) {
  if (document.getElementById) {
    document.getElementById(menu).className = newClass;
  }
}
document.onselectstart = new Function("return false");
</script>

 <body class=menu>
 

	<div id='cont'>
<div id="menu2" class="menuOut" onclick="SwitchMenu('sub2')" 
        onmouseover="ChangeClass('menu2','menuOver')" onmouseout="ChangeClass('menu2','menuOut')">
        <a > Évszámok szerint</a></div>
	<div class="menuOut" id="sub2" style="display: none;">	<div id='cont'>
<div id="menu3" class="menuOut" onclick="SwitchMenu('sub3')" 
        onmouseover="ChangeClass('menu3','menuOver')" onmouseout="ChangeClass('menu3','menuOut')">
        <a > 1989</a></div>

	<div class="submenu" id="sub3" style="display: none;">	<div id='cont'>
<div id="menu4" class="menuOut" onclick="SwitchMenu('sub4')" 
        onmouseover="ChangeClass('menu4','menuOver')" onmouseout="ChangeClass('menu4','menuOut')">
        <a href='Ujsagoldalak.php?szam=1989_01' width=10000 target=main_window> 1. szám</a></div>
<div id="menu5" class="menuOut" onclick="SwitchMenu('sub5')" 
        onmouseover="ChangeClass('menu5','menuOver')" onmouseout="ChangeClass('menu5','menuOut')">
        <a > 2. szám</a></div>
  </div></div>
<div id="menu6" class="menuOut" onclick="SwitchMenu('sub6')" 
        onmouseover="ChangeClass('menu6','menuOver')" onmouseout="ChangeClass('menu6','menuOut')">
        <a > 1990</a></div>

	<div class="submenu" id="sub6" style="display: none;">	<div id='cont'>
<div id="menu7" class="menuOut" onclick="SwitchMenu('sub7')" 
        onmouseover="ChangeClass('menu7','menuOver')" onmouseout="ChangeClass('menu7','menuOut')">
        <a > 1. szám</a></div>
<div id="menu8" class="menuOut" onclick="SwitchMenu('sub8')" 
        onmouseover="ChangeClass('menu8','menuOver')" onmouseout="ChangeClass('menu8','menuOut')">
        <a > 2. szám</a></div>
<div id="menu9" class="menuOut" onclick="SwitchMenu('sub9')" 
        onmouseover="ChangeClass('menu9','menuOver')" onmouseout="ChangeClass('menu9','menuOut')">
        <a > 3. szám</a></div>
<div id="menu10" class="menuOut" onclick="SwitchMenu('sub10')" 
        onmouseover="ChangeClass('menu10','menuOver')" onmouseout="ChangeClass('menu10','menuOut')">
        <a > 4. szám</a></div>
<div id="menu11" class="menuOut" onclick="SwitchMenu('sub11')" 
        onmouseover="ChangeClass('menu11','menuOver')" onmouseout="ChangeClass('menu11','menuOut')">
        <a > 5. szám</a></div>
<div id="menu12" class="menuOut" onclick="SwitchMenu('sub12')" 
        onmouseover="ChangeClass('menu12','menuOver')" onmouseout="ChangeClass('menu12','menuOut')">
        <a > 6. szám</a></div>
  </div></div>
<div id="menu13" class="menuOut" onclick="SwitchMenu('sub13')" 
        onmouseover="ChangeClass('menu13','menuOver')" onmouseout="ChangeClass('menu13','menuOut')">
        <a > 1991</a></div>

	<div class="submenu" id="sub13" style="display: none;">	<div id='cont'>
<div id="menu14" class="menuOut" onclick="SwitchMenu('sub14')" 
        onmouseover="ChangeClass('menu14','menuOver')" onmouseout="ChangeClass('menu14','menuOut')">
        <a > 1. szám</a></div>
<div id="menu15" class="menuOut" onclick="SwitchMenu('sub15')" 
        onmouseover="ChangeClass('menu15','menuOver')" onmouseout="ChangeClass('menu15','menuOut')">
        <a > 2. szám</a></div>
<div id="menu16" class="menuOut" onclick="SwitchMenu('sub16')" 
        onmouseover="ChangeClass('menu16','menuOver')" onmouseout="ChangeClass('menu16','menuOut')">
        <a > 3. szám</a></div>
<div id="menu17" class="menuOut" onclick="SwitchMenu('sub17')" 
        onmouseover="ChangeClass('menu17','menuOver')" onmouseout="ChangeClass('menu17','menuOut')">
        <a > 4-5. szám</a></div>
<div id="menu18" class="menuOut" onclick="SwitchMenu('sub18')" 
        onmouseover="ChangeClass('menu18','menuOver')" onmouseout="ChangeClass('menu18','menuOut')">
        <a > 6. szám</a></div>
  </div></div>
<div id="menu19" class="menuOut" onclick="SwitchMenu('sub19')" 
        onmouseover="ChangeClass('menu19','menuOver')" onmouseout="ChangeClass('menu19','menuOut')">
        <a > 1992</a></div>

	<div class="submenu" id="sub19" style="display: none;">	<div id='cont'>
<div id="menu20" class="menuOut" onclick="SwitchMenu('sub20')" 
        onmouseover="ChangeClass('menu20','menuOver')" onmouseout="ChangeClass('menu20','menuOut')">
        <a > 1. szám</a></div>
<div id="menu21" class="menuOut" onclick="SwitchMenu('sub21')" 
        onmouseover="ChangeClass('menu21','menuOver')" onmouseout="ChangeClass('menu21','menuOut')">
        <a > 2. szám</a></div>
<div id="menu22" class="menuOut" onclick="SwitchMenu('sub22')" 
        onmouseover="ChangeClass('menu22','menuOver')" onmouseout="ChangeClass('menu22','menuOut')">
        <a > 3. szám</a></div>
<div id="menu23" class="menuOut" onclick="SwitchMenu('sub23')" 
        onmouseover="ChangeClass('menu23','menuOver')" onmouseout="ChangeClass('menu23','menuOut')">
        <a > 4. szám</a></div>
<div id="menu24" class="menuOut" onclick="SwitchMenu('sub24')" 
        onmouseover="ChangeClass('menu24','menuOver')" onmouseout="ChangeClass('menu24','menuOut')">
        <a > 5. szám</a></div>
  </div></div>
<div id="menu25" class="menuOut" onclick="SwitchMenu('sub25')" 
        onmouseover="ChangeClass('menu25','menuOver')" onmouseout="ChangeClass('menu25','menuOut')">
        <a > 1993</a></div>

	<div class="submenu" id="sub25" style="display: none;">	<div id='cont'>
<div id="menu26" class="menuOut" onclick="SwitchMenu('sub26')" 
        onmouseover="ChangeClass('menu26','menuOver')" onmouseout="ChangeClass('menu26','menuOut')">
        <a > 1. szám</a></div>
<div id="menu27" class="menuOut" onclick="SwitchMenu('sub27')" 
        onmouseover="ChangeClass('menu27','menuOver')" onmouseout="ChangeClass('menu27','menuOut')">
        <a > 2. szám</a></div>
<div id="menu28" class="menuOut" onclick="SwitchMenu('sub28')" 
        onmouseover="ChangeClass('menu28','menuOver')" onmouseout="ChangeClass('menu28','menuOut')">
        <a > 3. szám</a></div>
<div id="menu29" class="menuOut" onclick="SwitchMenu('sub29')" 
        onmouseover="ChangeClass('menu29','menuOver')" onmouseout="ChangeClass('menu29','menuOut')">
        <a > 4. szám</a></div>
<div id="menu30" class="menuOut" onclick="SwitchMenu('sub30')" 
        onmouseover="ChangeClass('menu30','menuOver')" onmouseout="ChangeClass('menu30','menuOut')">
        <a > 5. szám</a></div>
  </div></div>
<div id="menu31" class="menuOut" onclick="SwitchMenu('sub31')" 
        onmouseover="ChangeClass('menu31','menuOver')" onmouseout="ChangeClass('menu31','menuOut')">
        <a > 1994</a></div>

	<div class="submenu" id="sub31" style="display: none;">	<div id='cont'>
<div id="menu32" class="menuOut" onclick="SwitchMenu('sub32')" 
        onmouseover="ChangeClass('menu32','menuOver')" onmouseout="ChangeClass('menu32','menuOut')">
        <a > 1. szám</a></div>
<div id="menu32" class="menuOut" onclick="SwitchMenu('sub32')" 
        onmouseover="ChangeClass('menu32','menuOver')" onmouseout="ChangeClass('menu32','menuOut')">
        <a > 2. szám</a></div>
<div id="menu33" class="menuOut" onclick="SwitchMenu('sub33')" 
        onmouseover="ChangeClass('menu34','menuOver')" onmouseout="ChangeClass('menu34','menuOut')">
        <a > 3. szám</a></div>
<div id="menu35" class="menuOut" onclick="SwitchMenu('sub35')" 
        onmouseover="ChangeClass('menu35','menuOver')" onmouseout="ChangeClass('menu35','menuOut')">
        <a > 4. szám</a></div>
<div id="menu36" class="menuOut" onclick="SwitchMenu('sub36')" 
        onmouseover="ChangeClass('menu36','menuOver')" onmouseout="ChangeClass('menu36','menuOut')">
        <a > 5. szám</a></div>
 <div id="menu37" class="menuOut" onclick="SwitchMenu('sub37')" 
        onmouseover="ChangeClass('menu37','menuOver')" onmouseout="ChangeClass('menu37','menuOut')">
        <a > 6. szám</a></div>
 </div></div>
<div id="menu38" class="menuOut" onclick="SwitchMenu('sub38')" 
        onmouseover="ChangeClass('menu38','menuOver')" onmouseout="ChangeClass('menu38','menuOut')">
        <a > 1995</a></div>

	<div class="submenu" id="sub38" style="display: none;">	<div id='cont'>
<div id="menu39" class="menuOut" onclick="SwitchMenu('sub39')" 
        onmouseover="ChangeClass('menu39','menuOver')" onmouseout="ChangeClass('menu39','menuOut')">
        <a > 1. szám</a></div>
<div id="menu40" class="menuOut" onclick="SwitchMenu('sub40')" 
        onmouseover="ChangeClass('menu40','menuOver')" onmouseout="ChangeClass('menu40','menuOut')">
        <a > 2. szám</a></div>
<div id="menu41" class="menuOut" onclick="SwitchMenu('sub41')" 
        onmouseover="ChangeClass('menu41','menuOver')" onmouseout="ChangeClass('menu41','menuOut')">
        <a > 3. szám</a></div>
<div id="menu42" class="menuOut" onclick="SwitchMenu('sub42')" 
        onmouseover="ChangeClass('menu42','menuOver')" onmouseout="ChangeClass('menu42','menuOut')">
        <a > 4. szám</a></div>
<div id="menu43" class="menuOut" onclick="SwitchMenu('sub43')" 
        onmouseover="ChangeClass('menu43','menuOver')" onmouseout="ChangeClass('menu43','menuOut')">
        <a > 5. szám</a></div>
 </div></div>
<div id="menu44" class="menuOut" onclick="SwitchMenu('sub44')" 
        onmouseover="ChangeClass('menu44','menuOver')" onmouseout="ChangeClass('menu44','menuOut')">
        <a > 1996</a></div>

	<div class="submenu" id="sub44" style="display: none;">	<div id='cont'>
<div id="menu45" class="menuOut" onclick="SwitchMenu('sub45')" 
        onmouseover="ChangeClass('menu45','menuOver')" onmouseout="ChangeClass('menu45','menuOut')">
        <a > 1. szám</a></div>
<div id="menu46" class="menuOut" onclick="SwitchMenu('sub46')" 
        onmouseover="ChangeClass('menu46','menuOver')" onmouseout="ChangeClass('menu46','menuOut')">
        <a > 2. szám</a></div>
<div id="menu47" class="menuOut" onclick="SwitchMenu('sub47')" 
        onmouseover="ChangeClass('menu47','menuOver')" onmouseout="ChangeClass('menu47','menuOut')">
        <a > 3. szám</a></div>
 </div></div>
<div id="menu48" class="menuOut" onclick="SwitchMenu('sub48')" 
        onmouseover="ChangeClass('menu48','menuOver')" onmouseout="ChangeClass('menu48','menuOut')">
        <a > 1997</a></div>

	<div class="submenu" id="sub48" style="display: none;">	<div id='cont'>
<div id="menu49" class="menuOut" onclick="SwitchMenu('sub49')" 
        onmouseover="ChangeClass('menu49','menuOver')" onmouseout="ChangeClass('menu49','menuOut')">
        <a > 1. szám</a></div>
<div id="menu50" class="menuOut" onclick="SwitchMenu('sub50')" 
        onmouseover="ChangeClass('menu50','menuOver')" onmouseout="ChangeClass('menu50','menuOut')">
        <a > 2. szám</a></div>
 </div></div>
<div id="menu51" class="menuOut" onclick="SwitchMenu('sub51')" 
        onmouseover="ChangeClass('menu51','menuOver')" onmouseout="ChangeClass('menu51','menuOut')">
        <a > 1998</a></div>

	<div class="menuOut" id="sub51" style="display: none;">	<div id='cont'>
<div id="menu52" class="menuOut" onclick="SwitchMenu('sub52')" 
        onmouseover="ChangeClass('menu52','menuOver')" onmouseout="ChangeClass('menu52','menuOut')">
        <a > 1. szám</a></div>

	<div class="submenu" id="sub52" style="display: none;">	<div id='cont'>
<div id="menu53" class="menuOut" onclick="SwitchMenu('sub53')" 
        onmouseover="ChangeClass('menu53','menuOver')" onmouseout="ChangeClass('menu53','menuOut')">
        <a > Veresegyház-erdőkertesi változat</a></div>
<div id="menu54" class="menuOut" onclick="SwitchMenu('sub54')" 
        onmouseover="ChangeClass('menu54','menuOver')" onmouseout="ChangeClass('menu54','menuOut')">
        <a > Rádi változat</a></div>
<div id="menu55" class="menuOut" onclick="SwitchMenu('sub55')" 
        onmouseover="ChangeClass('menu55','menuOver')" onmouseout="ChangeClass('menu55','menuOut')">
        <a > Szobi változat</a></div>
</div></div></div></div>
</HTML>