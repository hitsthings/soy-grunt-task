package test;

import java.util.*;
import com.google.template.soy.jssrc.restricted.JsExpr;
import com.google.template.soy.jssrc.restricted.SoyJsSrcPrintDirective;

public class DirectivePlugin implements SoyJsSrcPrintDirective {
	
	public JsExpr applyForJsSrc(JsExpr value, List<JsExpr> args) {
		return new JsExpr("Directive called.", 1);
	}

	public String getName() {
		return "|testdirective";
	}

	public Set<Integer> getValidArgsSizes() {
  		HashSet <Integer> sizes = new HashSet <Integer>();
		sizes.add(0);
  		return sizes;
	}

	public boolean shouldCancelAutoescape() {
		return true;
	}

}