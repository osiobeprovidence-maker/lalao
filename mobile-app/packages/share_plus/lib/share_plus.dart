import 'package:flutter/services.dart';

class Share {
  static Future<void> share(String text, {String? subject}) async {
    await Clipboard.setData(ClipboardData(text: text));
  }
}
