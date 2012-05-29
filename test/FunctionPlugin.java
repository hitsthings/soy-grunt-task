package test;

import java.util.*;
import com.google.template.soy.jssrc.restricted.JsExpr;
import com.google.template.soy.jssrc.restricted.SoyJsSrcFunction;

public class FunctionPlugin implements SoyJsSrcFunction {
	
	public JsExpr computeForJsSrc(List<JsExpr> args) {
		return new JsExpr("SoyFunction called.", 1);
	}

	public String getName() {
		return "testfunc";
	}

	public Set<Integer> getValidArgsSizes() {
  		HashSet <Integer> sizes = new HashSet <Integer>();
		sizes.add(0);
  		return sizes;
	}

}