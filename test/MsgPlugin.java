package test;

import java.util.*;
import com.google.template.soy.jssrc.restricted.JsExpr;
import com.google.template.soy.msgs.SoyMsgBundle;
import com.google.template.soy.msgs.restricted.SoyMsgBundleImpl;
import com.google.template.soy.msgs.SoyMsgBundleHandler.OutputFileOptions;
import com.google.template.soy.msgs.SoyMsgException;
import com.google.template.soy.msgs.SoyMsgPlugin;
import com.google.template.soy.msgs.restricted.SoyMsg;
import com.google.template.soy.msgs.restricted.SoyMsgPart;
import com.google.template.soy.msgs.restricted.SoyMsgRawTextPart;

public class MsgPlugin implements SoyMsgPlugin {
	
	public CharSequence generateExtractedMsgsFile(SoyMsgBundle msgBundle, OutputFileOptions options)  {
		return "Message Plugin called.";
	}

	public SoyMsgBundle parseTranslatedMsgsFile(String inputFileContent) {
		List<SoyMsgPart> parts = new ArrayList<SoyMsgPart>();
		parts.add(new SoyMsgRawTextPart("Message Plugin called."));

		List<SoyMsg> msgs = new ArrayList<SoyMsg>();
		msgs.add(new SoyMsg(4716184983396970286l, "en", "Message Plugin called.", "Custom msg plugin", false, "text", "", parts));

		return new SoyMsgBundleImpl("en", msgs);
	}

}